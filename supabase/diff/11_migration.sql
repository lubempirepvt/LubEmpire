-- 1. Remove the foreign key and columns from containers
ALTER TABLE public.containers
DROP CONSTRAINT IF EXISTS containers_sticker_id_fkey,
DROP COLUMN IF EXISTS sticker_id,
DROP COLUMN IF EXISTS sticker_quantity;

-- 2. Add the sticker columns to your orders table instead!
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS sticker_id uuid REFERENCES materials(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sticker_quantity numeric DEFAULT 0;

-- 3. Refresh the cache so the API knows about the changes
NOTIFY pgrst, 'reload schema';