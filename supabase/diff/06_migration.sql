-- ==============================================================================
-- MIGRATION 6: STRUCTURAL FIXES & COMPREHENSIVE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. ADD MISSING COLUMNS
-- Adding the bulk unit tracking that was missed in earlier migrations
ALTER TABLE public.finished_products 
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'Ltr' CHECK (unit IN ('Ltr', 'KG'));

-- 2. RESTORE MISSING TABLES
-- Adding back the production and payment tracking tables from your queries
CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID REFERENCES public.finished_products(id) ON DELETE RESTRICT,
  quantity_produced NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_material_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_log_id UUID REFERENCES public.production_logs(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity_used NUMERIC NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- Locking down all the tables that were left completely open
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finished_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;

-- Locking down the newly restored tables
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_material_consumption ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- Applying the same rule across the board: Only authenticated users get access
CREATE POLICY "Full access for logged-in users" ON public.materials FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.finished_products FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.accounting_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.material_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.order_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.production_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access for logged-in users" ON public.production_material_consumption FOR ALL TO authenticated USING (true);