"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOrderAction, editOrderAction } from "@/app/actions/orders";

export default function OrderRowActions({
  order,
  stickers,
}: {
  order: any;
  stickers: {
    id: string;
    name: string;
    cost_per_unit?: number;
    stock: number;
    type?: string;
  }[];
}) {
  const router = useRouter();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sticker state (only ID needed now)
  const [selectedStickerId, setSelectedStickerId] = useState(
    order.sticker_id || "",
  );

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDeleting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await deleteOrderAction(fd);
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEditing(true);
    const fd = new FormData(e.currentTarget);
    try {
      await editOrderAction(fd);
      setIsEditOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setIsEditing(false);
    }
  };

  const glassBackdrop =
    "fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4 text-left";
  const glassModal =
    "bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl w-full max-w-lg overflow-hidden";
  const glassInput =
    "input-field !bg-white/50 !border-white/60 focus:!bg-white/90 focus:!border-[var(--lub-gold)] shadow-sm w-full";

  const LoadingSpinner = () => (
    <svg
      className="w-5 h-5 animate-spin text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  // Formatting helpers for the Info Modal
  const dateObj = new Date(order.created_at);
  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const paddedNum = String(order.order_number).padStart(4, "0");
  const formattedOrderId = `ORD-${yyyy}${mm}${dd}-${paddedNum}`;

  const containerPieces = order.containers?.pieces_per_box || 1;
  const totalPieces = order.boxes_quantity * containerPieces;
  const containerTypeStr =
    order.containers?.type?.toLowerCase() === "bucket" ? "bucket" : "bottle";

  return (
    <div className="flex justify-center items-center gap-1">
      {/* --- INFO ICON --- */}
      <button
        onClick={() => setIsInfoOpen(true)}
        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
        title="View Order Details"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>

      {/* --- EDIT ICON --- */}
      <button
        onClick={() => setIsEditOpen(true)}
        className="p-2 text-gray-400 hover:text-[var(--lub-gold)] transition-colors"
        title="Edit Order"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          />
        </svg>
      </button>

      {/* --- DELETE ICON --- */}
      <button
        onClick={() => setIsDeleteOpen(true)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="Delete Order & Restock Inventory"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* ================= INFO MODAL ================= */}
      {isInfoOpen && (
        <div className={glassBackdrop} onClick={() => setIsInfoOpen(false)}>
          <div className={glassModal} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/50 bg-white/40 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[var(--lub-dark)]">
                Order Details
              </h2>
              <button
                onClick={() => setIsInfoOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Order Number
                  </p>
                  <p className="text-sm font-black text-[#3F4A90] font-mono tracking-wider">
                    {formattedOrderId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Date & Time
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Customer Name
                  </p>
                  <p className="font-bold text-gray-800">
                    {order.customer_name}
                  </p>
                </div>

                <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Finished Product
                  </p>
                  <p className="font-bold text-gray-800">
                    {order.finished_products?.product_name}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Grade: {order.finished_products?.grade_name}
                  </p>
                </div>

                <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Packaging
                  </p>
                  <p className="font-bold text-gray-800">
                    {order.containers?.name}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {containerPieces} pcs / box
                  </p>
                </div>

                <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                    Sticker / Label
                  </p>
                  {order.sticker_id ? (
                    <>
                      <p className="font-bold text-gray-800 truncate">
                        {order.materials?.name}
                      </p>
                      <p className="text-xs text-blue-500 font-medium">
                        {order.sticker_quantity} pcs / {containerTypeStr}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-gray-400">None</p>
                  )}
                </div>
              </div>

              {/* Financials & Qty */}
              <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 shadow-inner space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-600">
                    Total Quantity
                  </span>
                  <span className="font-bold text-gray-900">
                    {order.boxes_quantity} Cartons{" "}
                    <span className="text-gray-400 font-medium">
                      ({totalPieces} PCS)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-green-100 pb-3">
                  <span className="font-bold text-gray-600">
                    Rate per piece
                  </span>
                  <span className="font-bold text-gray-900">
                    ₹
                    {Number(order.rate_per_piece).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="font-extrabold text-gray-700 uppercase tracking-wide text-sm">
                    Total Amount
                  </span>
                  <span
                    className={`font-black text-lg ${Number(order.total_amount) < 0 ? "text-red-600" : "text-green-700"}`}
                  >
                    {Number(order.total_amount) < 0 ? "-" : ""}₹
                    {Math.abs(Number(order.total_amount)).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gray-700 uppercase tracking-wide text-sm">
                    Est. Net Profit
                  </span>
                  <span
                    className={`font-black text-lg ${Number(order.calculated_profit) < 0 ? "text-red-600" : "text-green-700"}`}
                  >
                    {Number(order.calculated_profit) < 0 ? "-" : ""}₹
                    {Math.abs(Number(order.calculated_profit)).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50 flex shrink-0">
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-full py-2.5 px-4 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditOpen && (
        <div className={glassBackdrop}>
          <div className={glassModal}>
            <div className="px-6 py-4 border-b border-white/50 bg-white/40 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[var(--lub-dark)]">
                Edit Order
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-500 hover:text-red-500 text-2xl leading-none font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <input type="hidden" name="id" value={order.id} />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Customer Name
                </label>
                <input
                  className={glassInput}
                  type="text"
                  name="customer_name"
                  defaultValue={order.customer_name}
                  required
                />
              </div>

              {/* 🔥 STICKER FIELD AS A STANDARD INPUT */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Sticker / Label Design
                </label>
                <select
                  name="sticker_id"
                  className={glassInput}
                  value={selectedStickerId}
                  onChange={(e) => setSelectedStickerId(e.target.value)}
                >
                  <option value="">-- No Sticker Needed --</option>
                  {stickers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.stock} in stock)
                    </option>
                  ))}
                </select>
                {/* Hidden sticker quantity so backend receives it */}
                {selectedStickerId && (
                  <input type="hidden" name="sticker_quantity" value="1" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Qty (Cartons/Boxes)
                  </label>
                  <input
                    className={glassInput}
                    type="number"
                    name="boxes_quantity"
                    min="1"
                    defaultValue={order.boxes_quantity}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Rate per Piece (₹)
                  </label>
                  <input
                    className={glassInput}
                    type="number"
                    name="rate_per_piece"
                    step="0.01"
                    min="0.01"
                    defaultValue={order.rate_per_piece}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditing}
                  className="flex-1 py-2.5 px-4 border border-white/60 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-bold text-gray-700 hover:bg-white/80 transition-all shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="btn-primary flex-1 !rounded-xl shadow-lg shadow-[var(--lub-gold)]/20 flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isEditing ? (
                    <>
                      <LoadingSpinner /> Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {isDeleteOpen && (
        <div className={`${glassBackdrop} text-center`}>
          <div className={`${glassModal} p-8 !max-w-sm`}>
            <div className="w-16 h-16 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 drop-shadow-sm">
              Delete Order?
            </h3>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              This will permanently delete the order and{" "}
              <strong className="text-green-600">refund all stock</strong> back
              into your inventory.
            </p>

            <form onSubmit={handleDeleteSubmit} className="flex gap-3 mt-8">
              <input type="hidden" name="id" value={order.id} />
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 border border-white/60 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-bold text-gray-700 hover:bg-white/80 transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner /> Reversing...
                  </>
                ) : (
                  "Delete & Refund"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
