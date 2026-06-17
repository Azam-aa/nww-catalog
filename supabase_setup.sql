-- NWW Catalog Supabase Database Schema & Seed Script

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  cover_image_url VARCHAR,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR PRIMARY KEY,
  category_id VARCHAR REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- 3. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id VARCHAR REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id VARCHAR REFERENCES subcategories(id) ON DELETE SET NULL,
  image_url VARCHAR NOT NULL,
  title VARCHAR,
  material VARCHAR,
  color VARCHAR,
  size VARCHAR,
  description TEXT,
  price NUMERIC,
  cost_price NUMERIC,
  display_order INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'uncategorized', -- 'uncategorized' or 'categorized'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for Categories
DROP POLICY IF EXISTS "Allow public read on categories" ON categories;
CREATE POLICY "Allow public read on categories" ON categories 
  FOR SELECT TO public USING (true);

-- 6. Create RLS policies for Subcategories
DROP POLICY IF EXISTS "Allow public read on subcategories" ON subcategories;
CREATE POLICY "Allow public read on subcategories" ON subcategories 
  FOR SELECT TO public USING (true);

-- 7. Create RLS policies for Products
DROP POLICY IF EXISTS "Allow public read on products" ON products;
CREATE POLICY "Allow public read on products" ON products 
  FOR SELECT TO public USING (true);

-- Note on write policies: Since all writes (inserts, updates, deletes) will be performed 
-- from Next.js server-side API routes or Server Actions utilizing the SUPABASE_SERVICE_ROLE_KEY,
-- these operations bypass RLS automatically. Therefore, no public/anon write policies are created.

-- 8. Create Storage bucket for product images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Create Storage Policy for public read access to the bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'product-images');

-- 10. Seed Categories
INSERT INTO categories (id, name, slug, display_order) VALUES
('almari', 'Almirahs', 'almari', 1),
('cots', 'Cots & Beds', 'cots', 2),
('sofa', 'Sofa', 'sofa', 3),
('dressing-table', 'Dressing Table', 'dressing-table', 4),
('chairs', 'Chairs', 'chairs', 5),
('stools-ladders', 'Stools & Ladders', 'stools-ladders', 6),
('racks', 'Racks', 'racks', 7),
('tables', 'Tables', 'tables', 8),
('lockers', 'Lockers', 'lockers', 9),
('trunks', 'Trunks', 'trunks', 10)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  display_order = EXCLUDED.display_order;

-- 11. Seed Subcategories
INSERT INTO subcategories (id, category_id, name, slug, display_order) VALUES
-- Almirahs (11 types)
('sd-lw', 'almari', 'SD Almari (LW)', 'sd-lw', 1),
('sd-mh', 'almari', 'SD Almari (MH)', 'sd-mh', 2),
('sd-h', 'almari', 'SD Almari (H)', 'sd-h', 3),
('dd-lw', 'almari', 'DD Almari (LW)', 'dd-lw', 4),
('dd-mh', 'almari', 'DD Almari (MH)', 'dd-mh', 5),
('dd-h', 'almari', 'DD Almari (H)', 'dd-h', 6),
('td-lw', 'almari', 'TD Almari (LW)', 'td-lw', 7),
('td-mh', 'almari', 'TD Almari (MH)', 'td-mh', 8),
('td-h', 'almari', 'TD Almari (H)', 'td-h', 9),
('office', 'almari', 'Office Almari', 'office', 10),
('wall-doors', 'almari', 'Wall Doors', 'wall-doors', 11),
-- Cots & Beds (9 types)
('up-down', 'cots', 'Up & Down Cots', 'up-down', 1),
('bail-patti', 'cots', 'Bail patti cots', 'bail-patti', 2),
('nawar', 'cots', 'Nawar Cots', 'nawar', 3),
('single-rm', 'cots', 'Single Cots (RM)', 'single-rm', 4),
('single-h', 'cots', 'Single Cots (H)', 'single-h', 5),
('double-rm', 'cots', 'Double cots (RM)', 'double-rm', 6),
('double-mh', 'cots', 'Double cots (MH)', 'double-mh', 7),
('four-and-half', 'cots', '4½\'×6\'.2" cots (H)', 'four-and-half', 8),
('five-by-six', 'cots', '5\'×6½\' cots (H)', 'five-by-six', 9),
-- Sofa (1 type)
('sofa-diwan', 'sofa', 'Sofa & Diwan cot', 'sofa-diwan', 1),
-- Dressing Table (1 type)
('dressing-table-sub', 'dressing-table', 'Dressing Table', 'dressing-table-sub', 1),
-- Chairs (3 types)
('metal-chairs', 'chairs', 'Metal Chair', 'metal-chairs', 1),
('steel-chairs', 'chairs', 'Steel Chair', 'steel-chairs', 2),
('plastic-chairs', 'chairs', 'Plastic Chair', 'plastic-chairs', 3),
-- Stools & Ladders (2 types)
('plastic-stools', 'stools-ladders', 'Plastic Stools', 'plastic-stools', 1),
('ladders-stools', 'stools-ladders', 'Ladders & Stools', 'ladders-stools', 2),
-- Racks (1 type)
('racks-sub', 'racks', 'Racks', 'racks-sub', 1),
-- Tables (2 types)
('office-table', 'tables', 'Office Table', 'office-table', 1),
('dining-table', 'tables', 'Dining Table', 'dining-table', 2),
-- Lockers (1 type)
('lockers-sub', 'lockers', 'Lockers', 'lockers-sub', 1),
-- Trunks (1 type)
('trunks-sub', 'trunks', 'Trunks', 'trunks-sub', 1)
ON CONFLICT (id) DO UPDATE SET 
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  display_order = EXCLUDED.display_order;
