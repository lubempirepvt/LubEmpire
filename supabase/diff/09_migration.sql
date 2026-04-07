-- 1. Create the new column FIRST
ALTER TABLE public.containers 
ADD COLUMN base_container_id uuid NULL;

-- 2. Add the relationship so Variants know who their Base Container is
ALTER TABLE public.containers 
ADD CONSTRAINT containers_base_container_id_fkey 
FOREIGN KEY (base_container_id) REFERENCES public.containers(id) ON DELETE CASCADE;

-- 3. Make Sticker ID nullable so deleting a sticker doesn't crash the database
ALTER TABLE public.containers 
ALTER COLUMN sticker_id DROP NOT NULL;

-- 4. Drop the old strict sticker constraint (using IF EXISTS just to be safe)
ALTER TABLE public.containers 
DROP CONSTRAINT IF EXISTS containers_sticker_id_fkey;

-- 5. Add the new flexible ON DELETE SET NULL behavior to the sticker constraint
ALTER TABLE public.containers 
ADD CONSTRAINT containers_sticker_id_fkey 
FOREIGN KEY (sticker_id) REFERENCES public.materials(id) ON DELETE SET NULL;