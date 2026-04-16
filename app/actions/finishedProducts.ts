"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addFinishedProductAction(formData: FormData) {
  const product_name = formData.get("product_name") as string;
  const grade_name = formData.get("grade_name") as string;
  const unit = formData.get("unit") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("finished_products").insert({
    product_name,
    grade_name,
    unit,
    stock: 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/finished-products");
}

export async function editFinishedProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  const product_name = formData.get("product_name") as string;
  const grade_name = formData.get("grade_name") as string;
  const unit = formData.get("unit") as string;

  const supabase = await createClient();
  const { error } = await supabase
    .from("finished_products")
    .update({ product_name, grade_name, unit })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/finished-products");
}

export async function deleteFinishedProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  // 1. Delete linked sales orders
  await supabase.from("orders").delete().eq("finished_product_id", id);

  // 2. Fetch linked production logs to clear them out
  const { data: prodLogs } = await supabase
    .from("production_logs")
    .select("id")
    .eq("finished_product_id", id);

  const logIds = prodLogs?.map((log) => log.id) || [];

  // 3. If there are production logs, we must delete their material usage first
  if (logIds.length > 0) {
    await supabase
      .from("production_material_consumption")
      .delete()
      .in("production_log_id", logIds);

    // 4. Now safely delete the production logs themselves
    await supabase
      .from("production_logs")
      .delete()
      .eq("finished_product_id", id);
  }

  // 5. FINALLY, the database locks are completely gone. Delete the Finished Product!
  const { error } = await supabase
    .from("finished_products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    throw new Error(error.message);
  }

  // Refresh pages
  revalidatePath("/finished-products");
  revalidatePath("/accounting/orders");
  revalidatePath("/reports");
}

export async function addProductionEntryAction(formData: FormData) {
  const finished_product_id = formData.get("finished_product_id") as string;
  const quantity_produced = Number(formData.get("quantity_produced"));

  const rawMaterialsJSON = formData.get("raw_materials") as string;
  const consumedMaterials = JSON.parse(rawMaterialsJSON) as {
    material_id: string;
    quantity: number;
  }[];

  const supabase = await createClient();

  // 1. Fetch current stock AND cost of the finished product
  const { data: fp, error: fpError } = await supabase
    .from("finished_products")
    .select("stock, cost_per_unit")
    .eq("id", finished_product_id)
    .single();
  if (fpError || !fp) throw new Error("Finished Product not found");

  // 2. Fetch current stock AND cost of all used raw materials
  const materialIds = consumedMaterials.map((m) => m.material_id);
  const { data: rawMaterials } = await supabase
    .from("materials")
    .select("id, stock, name, cost_per_unit")
    .in("id", materialIds);

  // 🌟 PRE-FLIGHT CHECK & CALCULATE COST 🌟
  let totalProductionCost = 0;

  for (const consumed of consumedMaterials) {
    const rm = rawMaterials?.find((m) => m.id === consumed.material_id);
    if (!rm) throw new Error("Raw Material not found in database.");

    // Bulletproof check before any DB updates happen!
    if (consumed.quantity > (rm.stock || 0)) {
      throw new Error(
        `Insufficient stock for ${rm.name}. You need ${consumed.quantity}, but only have ${rm.stock} available.`,
      );
    }
    totalProductionCost += consumed.quantity * Number(rm.cost_per_unit || 0);
  }

  // 🌟 MOVING AVERAGE MATH FOR THE FINISHED PRODUCT 🌟
  let currentFPStock = Number(fp.stock || 0);
  let currentFPCost = Number(fp.cost_per_unit || 0);

  const currentFPValue = currentFPStock * currentFPCost;
  const newFPStock = currentFPStock + quantity_produced;
  const newFPAvgCost =
    newFPStock > 0 ? (currentFPValue + totalProductionCost) / newFPStock : 0;

  // 3. Create Production Log
  const { data: prodLog, error: logError } = await supabase
    .from("production_logs")
    .insert({ finished_product_id, quantity_produced })
    .select("id")
    .single();

  if (logError || !prodLog) throw new Error("Failed to create production log");

  // 4. Update Finished Product Stock AND New Blended Cost
  await supabase
    .from("finished_products")
    .update({ stock: newFPStock, cost_per_unit: newFPAvgCost })
    .eq("id", finished_product_id);

  // 5. Deduct Raw Materials & Log Consumption
  for (const consumed of consumedMaterials) {
    const rm = rawMaterials?.find((m) => m.id === consumed.material_id);
    const newRMStock = Number(rm?.stock || 0) - consumed.quantity;

    await supabase
      .from("materials")
      .update({ stock: newRMStock })
      .eq("id", consumed.material_id);

    await supabase.from("production_material_consumption").insert({
      production_log_id: prodLog.id,
      raw_material_id: consumed.material_id,
      quantity_used: consumed.quantity,
    });

    await supabase.from("material_transactions").insert({
      material_id: consumed.material_id,
      transaction_type: "Production Use",
      quantity: -Math.abs(consumed.quantity),
      reason: `Used in production log ${prodLog.id}`,
    });
  }

  revalidatePath("/finished-products");
}

// 🔥 HIGHLY ROBUST EDIT ACTION: Pre-calculates deltas to prevent negative stock
export async function editProductionEntryAction(formData: FormData) {
  const log_id = formData.get("log_id") as string;
  const new_fp_id = formData.get("finished_product_id") as string;
  const new_qty_produced = Number(formData.get("quantity_produced"));

  const rawMaterialsJSON = formData.get("raw_materials") as string;
  const new_consumed_materials = JSON.parse(rawMaterialsJSON) as {
    material_id: string;
    quantity: number;
  }[];

  const supabase = await createClient();

  // 1. Fetch old log & old consumptions
  const { data: oldLog } = await supabase
    .from("production_logs")
    .select("*")
    .eq("id", log_id)
    .single();
  if (!oldLog) throw new Error("Log not found");

  const { data: oldConsumptions } = await supabase
    .from("production_material_consumption")
    .select("*")
    .eq("production_log_id", log_id);

  // 2. Fetch Finished Products
  const fpIds = Array.from(new Set([oldLog.finished_product_id, new_fp_id]));
  const { data: fpData } = await supabase
    .from("finished_products")
    .select("id, stock, cost_per_unit")
    .in("id", fpIds);
  const oldFp = fpData?.find((fp) => fp.id === oldLog.finished_product_id);
  const newFp = fpData?.find((fp) => fp.id === new_fp_id);

  if (!oldFp || !newFp) throw new Error("Finished product data missing.");

  // ==========================================
  // 🚀 PRE-FLIGHT VALIDATION: CHECK ALL LIMITS
  // ==========================================

  // A. Check Finished Product stock limits
  if (oldLog.finished_product_id === new_fp_id) {
    const delta = new_qty_produced - Number(oldLog.quantity_produced);
    if (Number(oldFp.stock) + delta < 0) {
      throw new Error(
        "Cannot lower yield this much. The oil from this batch has already been sold and stock would go negative!",
      );
    }
  } else {
    if (Number(oldFp.stock) - Number(oldLog.quantity_produced) < 0) {
      throw new Error(
        "Cannot change product type. The original oil has already been sold and stock would go negative!",
      );
    }
  }

  // B. Calculate Raw Material NET DELTAS (New Qty - Old Qty)
  const rmDeltas = new Map<string, number>();

  // First, act like we refunded everything (negative delta)
  for (const oc of oldConsumptions || []) {
    rmDeltas.set(oc.raw_material_id, -Number(oc.quantity_used));
  }
  // Then add the new requirements
  for (const c of new_consumed_materials) {
    rmDeltas.set(
      c.material_id,
      (rmDeltas.get(c.material_id) || 0) + c.quantity,
    );
  }

  // Fetch all affected materials
  const allMaterialIds = Array.from(rmDeltas.keys());
  const { data: rawMaterials } = await supabase
    .from("materials")
    .select("id, stock, name, cost_per_unit")
    .in("id", allMaterialIds);

  // C. Check Raw Material stock limits
  let totalProductionCost = 0;
  for (const [matId, delta] of rmDeltas.entries()) {
    const rm = rawMaterials?.find((m) => m.id === matId);
    if (!rm) throw new Error("Raw Material not found.");

    // If the delta is positive, it means we need MORE of this item than we originally used.
    if (delta > Number(rm.stock)) {
      throw new Error(
        `Insufficient stock for ${rm.name}. Need ${delta.toFixed(2)} more, but only have ${Number(rm.stock).toFixed(2)} available.`,
      );
    }
  }

  // Calculate new total cost based on the newly requested materials
  for (const consumed of new_consumed_materials) {
    const rm = rawMaterials?.find((m) => m.id === consumed.material_id);
    totalProductionCost += consumed.quantity * Number(rm?.cost_per_unit || 0);
  }

  // ==========================================
  // 🚀 EXECUTION PHASE (100% Safe to write to DB)
  // ==========================================

  // 1. Update Finished Products
  if (oldLog.finished_product_id === new_fp_id) {
    const deltaYield = new_qty_produced - Number(oldLog.quantity_produced);
    const currentStock = Number(oldFp.stock);
    const currentCost = Number(oldFp.cost_per_unit);

    const newFPStock = currentStock + deltaYield;
    // Calculate new average cost safely (subtracting old value, adding new value)
    const baseValueRemaining =
      (currentStock - Number(oldLog.quantity_produced)) * currentCost;
    const newFPAvgCost =
      newFPStock > 0
        ? Math.max(0, (baseValueRemaining + totalProductionCost) / newFPStock)
        : 0;

    await supabase
      .from("finished_products")
      .update({ stock: newFPStock, cost_per_unit: newFPAvgCost })
      .eq("id", new_fp_id);
  } else {
    // Reverse old product completely
    const revertedStock =
      Number(oldFp.stock) - Number(oldLog.quantity_produced);
    await supabase
      .from("finished_products")
      .update({ stock: revertedStock })
      .eq("id", oldLog.finished_product_id);

    // Apply to new product completely
    const currentNewFpStock = Number(newFp.stock);
    const currentNewFpCost = Number(newFp.cost_per_unit);
    const newFPStock = currentNewFpStock + new_qty_produced;
    const newFPAvgCost =
      newFPStock > 0
        ? (currentNewFpStock * currentNewFpCost + totalProductionCost) /
          newFPStock
        : 0;
    await supabase
      .from("finished_products")
      .update({ stock: newFPStock, cost_per_unit: newFPAvgCost })
      .eq("id", new_fp_id);
  }

  // 2. Update Raw Materials & Transactions based on Deltas
  for (const [matId, delta] of rmDeltas.entries()) {
    if (delta !== 0) {
      const rm = rawMaterials?.find((m) => m.id === matId);
      await supabase
        .from("materials")
        .update({ stock: Number(rm?.stock) - delta })
        .eq("id", matId);

      await supabase.from("material_transactions").insert({
        material_id: matId,
        transaction_type:
          delta > 0
            ? "Production Edit (Extra Used)"
            : "Production Edit (Refunded)",
        quantity: -delta,
        reason: `Production Log Edit`,
      });
    }
  }

  // 3. Clear old consumptions and insert the exact new ones
  await supabase
    .from("production_material_consumption")
    .delete()
    .eq("production_log_id", log_id);

  const newConsumptions = new_consumed_materials.map((c) => ({
    production_log_id: log_id,
    raw_material_id: c.material_id,
    quantity_used: c.quantity,
  }));
  await supabase
    .from("production_material_consumption")
    .insert(newConsumptions);

  // 4. Update the actual log record
  await supabase
    .from("production_logs")
    .update({
      finished_product_id: new_fp_id,
      quantity_produced: new_qty_produced,
    })
    .eq("id", log_id);

  revalidatePath("/finished-products");
}
