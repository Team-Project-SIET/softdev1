-- Seed data for NongJames Laundry API
-- Run this after migrations to populate the database with initial data

-- Insert default admin user (password: admin123)
INSERT INTO users (id, full_name, email, password, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'System Admin',
  'admin@nongjames.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample services
INSERT INTO services (id, name, description, category, base_price, price_per_kg, estimated_days, is_rush_available, is_active, display_order, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Wash & Fold', 'Standard washing and folding service', 'WASH', '50.00', '50.00', 2, true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'Dry Clean', 'Professional dry cleaning service', 'DRY_CLEAN', '150.00', NULL, 3, true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), 'Ironing Service', 'Professional ironing service', 'SPECIAL_CARE', '30.00', NULL, 1, false, true, 3, NOW(), NOW()),
  (gen_random_uuid(), 'Rush Service', 'Same day express service', 'RUSH_SERVICE', '100.00', '100.00', 1, true, true, 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, customer_type, is_active, loyalty_points, membership_level, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'John Doe', 'john@example.com', '0812345678', 'INDIVIDUAL', true, 0, 'STANDARD', NOW(), NOW()),
  (gen_random_uuid(), 'Jane Smith', 'jane@example.com', '0898765432', 'INDIVIDUAL', true, 100, 'VIP', NOW(), NOW()),
  (gen_random_uuid(), 'ABC Company', 'contact@abc.com', '021234567', 'B2B', true, 0, 'STANDARD', NOW(), NOW())
ON CONFLICT DO NOTHING;
