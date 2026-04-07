-- 1. Add the relationship so Variants know who their Base Container is
ALTER TABLE public.containers 
ADD CONSTRAINT containers_base_container_id_fkey 
FOREIGN KEY (base_container_id) REFERENCES public.containers(id) ON DELETE CASCADE;

-- 2. Make Sticker ID nullable so deleting a sticker doesn't crash the database
ALTER TABLE public.containers 
ALTER COLUMN sticker_id DROP NOT NULL;

-- 3. Add the ON DELETE SET NULL behavior to the sticker constraint
-- (Note: you have to drop the old constraint first, then add the new one)
ALTER TABLE public.containers 
DROP CONSTRAINT containers_sticker_id_fkey;

ALTER TABLE public.containers 
ADD CONSTRAINT containers_sticker_id_fkey 
FOREIGN KEY (sticker_id) REFERENCES public.materials(id) ON DELETE SET NULL;