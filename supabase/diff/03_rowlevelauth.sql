-- 1. Turn ON the security locks (Removes the red badge)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create the rule: Only logged-in users can access Profiles
CREATE POLICY "Full access for logged-in users" 
ON public.profiles FOR ALL TO authenticated USING (true);

-- 3. Create the rule: Only logged-in users can access Containers
CREATE POLICY "Full access for logged-in users" 
ON public.containers FOR ALL TO authenticated USING (true);

-- 4. Create the rule: Only logged-in users can access Container Transactions
CREATE POLICY "Full access for logged-in users" 
ON public.container_transactions FOR ALL TO authenticated USING (true);