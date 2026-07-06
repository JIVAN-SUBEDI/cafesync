
-- =====================
-- 1. CORE SYSTEM TABLES
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Platform admins (SaaS owners/developers)
CREATE TABLE IF NOT EXISTS main_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{"manage_platform": true}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Subscription plans for hotels
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_per_year DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'yearly',
    max_staff INT NOT NULL,
    max_tables INT NOT NULL,
    max_menu_items INT NOT NULL,
    features JSONB DEFAULT '{}',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- 2. HOTELS (TENANTS)
-- =====================

-- Hotels table - Each hotel has exactly one admin
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Hotel Details
    hotel_name VARCHAR(255) NOT NULL,
    hotel_slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Admin Details (Single admin per hotel)
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_phone VARCHAR(50),

    hotel_img TEXT,
    
    -- Contact Info
    hotel_phone VARCHAR(50),
    hotel_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    
    -- Business Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,2) DEFAULT 0.10,
    service_charge DECIMAL(5,2) DEFAULT 0.05,
    
    -- Subscription Info
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, suspended, cancelled
    subscription_start_date DATE,
    subscription_end_date DATE,
    trial_ends_at DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    
    -- Cached limits from subscription plan
    max_staff_allowed INT DEFAULT 5,
    max_tables_allowed INT DEFAULT 20,
    max_menu_items_allowed INT DEFAULT 100,
    
    -- Hotel Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- 3. HOTEL STAFF (Managed by Hotel Admin)
-- =====================

-- CREATE TYPE staff_role_enum AS ENUM (
--     'manager',
--     'receptionist',
--     'waiter',
--     'cashier',
--     'cook',
--     'chef',
--     'cleaner'
-- );

-- -- Staff members for each hotel
-- CREATE TABLE IF NOT EXISTS staff (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
--     -- Staff Details
--     staff_code VARCHAR(50) NOT NULL, -- e.g., WA001, CK001
--     full_name VARCHAR(255) NOT NULL,
--     phone_number VARCHAR(50),
--     email VARCHAR(255),
    
--     -- Role & Permissions
--     role staff_role_enum NOT NULL,
--     pin_code VARCHAR(6), -- For POS login
--     permissions JSONB DEFAULT '{
--         "take_orders": true,
--         "process_payments": false,
--         "view_reports": false,
--         "manage_menu": false,
--         "manage_staff": false
--     }',
    
--     -- Status
--     is_active BOOLEAN DEFAULT true,
--     last_login TIMESTAMP,
    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
--     UNIQUE(hotel_id, staff_code),
--     UNIQUE(hotel_id, pin_code) WHERE pin_code IS NOT NULL
-- );

-- 2) Create enum only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role_enum') THEN
    CREATE TYPE staff_role_enum AS ENUM (
      'manager',
      'receptionist',
      'waiter',
      'cashier',
      'cook',
      'chef',
      'cleaner'
    );
  END IF;
END$$;

-- 3) Create staff table (no WHERE inside UNIQUE)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  staff_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  password VARCHAR(255),

  role staff_role_enum NOT NULL,
  pin_code VARCHAR(6),

  permissions JSONB DEFAULT '{
    "take_orders": true,
    "process_payments": false,
    "view_reports": false,
    "manage_menu": false,
    "manage_staff": false
  }',

  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (hotel_id, staff_code)
);

-- 4) Partial unique index for pin_code (correct way)
CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_pin_per_hotel
ON staff (hotel_id, pin_code)
WHERE pin_code IS NOT NULL;

-- =====================
-- 4. MENU MANAGEMENT (Managed by Hotel Admin)
-- =====================

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, name)
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    
    -- Item Details
    item_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Item Properties
    preparation_time INT, -- in minutes
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_vegetarian BOOLEAN DEFAULT false,
    dietary_info TEXT,
    
    -- Image
    image_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, item_code)
);

-- =====================
-- 5. TABLES MANAGEMENT (Managed by Hotel Admin)
-- =====================

-- Hotel tables
CREATE TABLE IF NOT EXISTS hotel_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Table Details
    table_number VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    capacity INT NOT NULL CHECK (capacity > 0),
    floor_number INT DEFAULT 1,
    section VARCHAR(50), -- e.g., "Main Hall", "Terrace"
    
    -- Status
    status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved, cleaning
    
    -- QR Code for table ordering
    qr_code_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, table_number)
);

-- =====================
-- 6. ORDERS & TRANSACTIONS
-- =====================

CREATE TYPE order_status_enum AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'served',
    'cancelled',
    'completed'
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'partial',
    'paid',
    'refunded'
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Order Details
    order_number VARCHAR(50) NOT NULL,
    table_id UUID REFERENCES hotel_tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES staff(id),
    
    -- Customer Info (for walk-in customers)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Order Totals
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status order_status_enum DEFAULT 'pending',
    payment_status payment_status_enum DEFAULT 'pending',
    
    -- Payment Info
    payment_method VARCHAR(50),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Notes
    special_instructions TEXT,
    kitchen_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    served_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    UNIQUE(hotel_id, order_number)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, served, cancelled
    
    prepared_by UUID REFERENCES staff(id),
    prepared_at TIMESTAMP,
    served_by UUID REFERENCES staff(id),
    served_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- 7. SUBSCRIPTION PAYMENTS
-- =====================

-- Subscription invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    billing_period_start DATE,
    billing_period_end DATE,
    due_date DATE,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- 8. FUNCTIONS & TRIGGERS
-- =====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    hotel_slug_text VARCHAR(100);
    order_count INT;
BEGIN
    SELECT hotel_slug INTO hotel_slug_text
    FROM hotels WHERE id = NEW.hotel_id;
    
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders
    WHERE hotel_id = NEW.hotel_id 
    AND DATE(created_at) = CURRENT_DATE;
    
    NEW.order_number := UPPER(hotel_slug_text) || '-' || 
                       TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                       LPAD(order_count::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate staff code
CREATE OR REPLACE FUNCTION generate_staff_code()
RETURNS TRIGGER AS $$
DECLARE
    role_prefix VARCHAR(2);
    staff_count INT;
BEGIN
    CASE NEW.role::text
        WHEN 'waiter' THEN role_prefix := 'WA';
        WHEN 'cook' THEN role_prefix := 'CK';
        WHEN 'chef' THEN role_prefix := 'CF';
        WHEN 'receptionist' THEN role_prefix := 'RC';
        WHEN 'cashier' THEN role_prefix := 'CA';
        WHEN 'manager' THEN role_prefix := 'MG';
        WHEN 'cleaner' THEN role_prefix := 'CL';
        ELSE role_prefix := 'ST';
    END CASE;
    
    SELECT COUNT(*) + 1 INTO staff_count
    FROM staff
    WHERE hotel_id = NEW.hotel_id 
    AND role = NEW.role;
    
    NEW.staff_code := role_prefix || LPAD(staff_count::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate table number if not provided
CREATE OR REPLACE FUNCTION generate_table_number()
RETURNS TRIGGER AS $$
DECLARE
    table_count INT;
BEGIN
    IF NEW.table_number IS NULL OR NEW.table_number = '' THEN
        SELECT COUNT(*) + 1 INTO table_count
        FROM hotel_tables
        WHERE hotel_id = NEW.hotel_id;
        
        NEW.table_number := 'T' || LPAD(table_count::TEXT, 3, '0');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate menu item code
CREATE OR REPLACE FUNCTION generate_menu_item_code()
RETURNS TRIGGER AS $$
DECLARE
    category_prefix VARCHAR(10);
    item_count INT;
BEGIN
    -- Get first 3 letters of category name
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO category_prefix
    FROM menu_categories
    WHERE id = NEW.category_id;
    
    -- Fallback if no category
    IF category_prefix IS NULL THEN
        category_prefix := 'GEN';
    END IF;
    
    -- Count items in this category
    SELECT COUNT(*) + 1 INTO item_count
    FROM menu_items
    WHERE hotel_id = NEW.hotel_id 
    AND category_id = NEW.category_id;
    
    NEW.item_code := category_prefix || '-' || LPAD(item_count::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal from order items
    UPDATE orders o
    SET 
        subtotal = COALESCE((
            SELECT SUM(total_price)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
            AND status != 'cancelled'
        ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- Calculate final total with tax and service charge
    UPDATE orders o
    SET 
        tax_amount = ROUND(o.subtotal * h.tax_rate, 2),
        service_charge = ROUND(o.subtotal * h.service_charge, 2),
        total_amount = o.subtotal + ROUND(o.subtotal * h.tax_rate, 2) + ROUND(o.subtotal * h.service_charge, 2) - o.discount_amount
    FROM hotels h
    WHERE o.id = COALESCE(NEW.order_id, OLD.order_id)
    AND o.hotel_id = h.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- =====================
-- 9. TRIGGERS
-- =====================

-- Update timestamps
CREATE TRIGGER update_hotels_updated_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_tables_updated_at
    BEFORE UPDATE ON hotel_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique identifiers
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER generate_staff_code_trigger
    BEFORE INSERT ON staff
    FOR EACH ROW EXECUTE FUNCTION generate_staff_code();

CREATE TRIGGER generate_table_number_trigger
    BEFORE INSERT ON hotel_tables
    FOR EACH ROW EXECUTE FUNCTION generate_table_number();

CREATE TRIGGER generate_menu_item_code_trigger
    BEFORE INSERT ON menu_items
    FOR EACH ROW EXECUTE FUNCTION generate_menu_item_code();

-- Update order totals
CREATE TRIGGER update_order_total_insert
    AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_update
    AFTER UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_delete
    AFTER DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- =====================
-- 10. PERFORMANCE INDEXES
-- =====================

-- Platform Level Indexes
CREATE INDEX idx_main_admins_email ON main_admins(email);
CREATE INDEX idx_main_admins_active ON main_admins(is_active);

CREATE INDEX idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- Hotel Level Indexes
CREATE INDEX idx_hotels_slug ON hotels(hotel_slug);
CREATE INDEX idx_hotels_admin_email ON hotels(admin_email);
CREATE INDEX idx_hotels_subscription_status ON hotels(subscription_status);
CREATE INDEX idx_hotels_is_active ON hotels(is_active);
CREATE INDEX idx_hotels_created_at ON hotels(created_at DESC);

-- Staff Indexes
CREATE INDEX idx_staff_hotel_id ON staff(hotel_id);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_staff_code ON staff(staff_code);
CREATE INDEX idx_staff_is_active ON staff(is_active);
CREATE INDEX idx_staff_pin_code ON staff(pin_code) WHERE pin_code IS NOT NULL;

-- Menu Indexes
CREATE INDEX idx_menu_categories_hotel_id ON menu_categories(hotel_id);
CREATE INDEX idx_menu_categories_is_active ON menu_categories(is_active);
CREATE INDEX idx_menu_categories_display_order ON menu_categories(display_order);

CREATE INDEX idx_menu_items_hotel_id ON menu_items(hotel_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_item_code ON menu_items(item_code);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_is_popular ON menu_items(is_popular);

-- Tables Indexes
CREATE INDEX idx_hotel_tables_hotel_id ON hotel_tables(hotel_id);
CREATE INDEX idx_hotel_tables_table_number ON hotel_tables(table_number);
CREATE INDEX idx_hotel_tables_status ON hotel_tables(status);

-- Orders Indexes
CREATE INDEX idx_orders_hotel_id ON orders(hotel_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_date_created ON orders(DATE(created_at));
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);

-- Order Items Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- Subscription Indexes
CREATE INDEX idx_subscription_invoices_hotel_id ON subscription_invoices(hotel_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX idx_subscription_invoices_invoice_number ON subscription_invoices(invoice_number);

-- =====================
-- 11. VIEWS FOR REPORTING
-- =====================

-- Hotel dashboard view
CREATE OR REPLACE VIEW hotel_dashboard_stats AS
SELECT 
    h.id as hotel_id,
    h.hotel_name,
    h.hotel_slug,
    h.subscription_status,
    h.subscription_end_date,
    
    -- Staff count
    (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id AND s.is_active = true) as active_staff_count,
    h.max_staff_allowed,
    
    -- Table count
    (SELECT COUNT(*) FROM hotel_tables t WHERE t.hotel_id = h.id) as table_count,
    h.max_tables_allowed,
    
    -- Menu items count
    (SELECT COUNT(*) FROM menu_items m WHERE m.hotel_id = h.id) as menu_items_count,
    h.max_menu_items_allowed,
    
    -- Today's orders
    (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id AND DATE(o.created_at) = CURRENT_DATE) as today_orders,
    (SELECT SUM(total_amount) FROM orders o WHERE o.hotel_id = h.id AND DATE(o.created_at) = CURRENT_DATE) as today_revenue,
    
    -- Monthly revenue
    (SELECT SUM(total_amount) FROM orders o 
     WHERE o.hotel_id = h.id 
     AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue
FROM hotels h
WHERE h.is_active = true;

-- Active orders view
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.id,
    o.hotel_id,
    o.order_number,
    o.table_id,
    t.table_number,
    o.waiter_id,
    s.full_name as waiter_name,
    o.customer_name,
    o.total_amount,
    o.status,
    o.payment_status,
    o.created_at,
    (
        SELECT COUNT(*) 
        FROM order_items oi 
        WHERE oi.order_id = o.id 
        AND oi.status IN ('pending', 'preparing')
    ) as pending_items
FROM orders o
LEFT JOIN hotel_tables t ON o.table_id = t.id
LEFT JOIN staff s ON o.waiter_id = s.id
WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
ORDER BY o.created_at DESC;

-- Menu items availability view
CREATE OR REPLACE VIEW menu_availability_view AS
SELECT 
    mi.id,
    mi.hotel_id,
    mi.item_code,
    mi.name,
    mi.price,
    mc.name as category_name,
    mi.is_available,
    mi.preparation_time,
    mi.is_popular,
    (SELECT COUNT(*) FROM order_items oi 
     WHERE oi.menu_item_id = mi.id 
     AND DATE(oi.created_at) = CURRENT_DATE) as today_orders
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.is_available = true
ORDER BY mc.display_order, mi.name;

-- =====================
-- 12. INITIAL DATA
-- =====================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, plan_name, plan_code, price_per_month, max_staff, max_tables, max_menu_items, description, features) VALUES
(
    uuid_generate_v4(),
    'Starter',
    'STARTER',
    29.99,
    3,
    10,
    50,
    'Perfect for small cafes and restaurants',
    '{"online_ordering": true, "basic_reports": true, "email_support": true}'
),
(
    uuid_generate_v4(),
    'Business',
    'BUSINESS',
    79.99,
    10,
    30,
    200,
    'For growing restaurants and hotels',
    '{"online_ordering": true, "advanced_reports": true, "phone_support": true, "table_reservations": true}'
),
(
    uuid_generate_v4(),
    'Enterprise',
    'ENTERPRISE',
    149.99,
    30,
    100,
    500,
    'For large hotels and restaurant chains',
    '{"online_ordering": true, "full_reports": true, "priority_support": true, "multi_branch": true, "custom_integrations": true}'
)
ON CONFLICT (plan_code) DO NOTHING;

-- Insert default platform admin (change password in production!)
INSERT INTO main_admins (id, email, password_hash, full_name) VALUES
(
    uuid_generate_v4(),
    'admin@hotelsaas.com',
    -- Password: Admin123! (change this in production)
    '$2a$12$YourHashedPasswordHere',
    'Platform Administrator'
)
ON CONFLICT (email) DO NOTHING;











-- Inventory part




CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, name)
);


CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    
    -- Item Details
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Stock Details
    current_quantity DECIMAL(10,3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    min_quantity DECIMAL(10,3) NOT NULL DEFAULT 10 CHECK (min_quantity >= 0),
    max_quantity DECIMAL(10,3) CHECK (max_quantity >= 0),
    unit VARCHAR(20) NOT NULL, -- kg, liters, pieces, grams, etc.
    
    -- Cost Details
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (current_quantity * unit_cost) STORED,
    
    -- Supplier Details
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(100),
    supplier_price DECIMAL(10,2),
    last_purchased_date DATE,
    reorder_point DECIMAL(10,3) DEFAULT 0,
    
    -- Status & Tracking
    status VARCHAR(20) DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock, discontinued
    is_active BOOLEAN DEFAULT true,
    location VARCHAR(100), -- Storage location
    barcode VARCHAR(100),
    expiry_date DATE,
    
    -- Consumption Tracking (for reporting)
    daily_consumption_avg DECIMAL(10,3) DEFAULT 0,
    monthly_consumption_avg DECIMAL(10,3) DEFAULT 0,
    last_consumption_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, item_code)
);

CREATE TYPE inventory_transaction_type AS ENUM (
    'purchase',
    'sale',
    'adjustment',
    'wastage',
    'transfer',
    'production',
    'consumption'
);



CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type inventory_transaction_type NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100), -- PO number, invoice number, etc.
    
    -- Quantity Details
    quantity_before DECIMAL(10,3) NOT NULL,
    quantity_change DECIMAL(10,3) NOT NULL, -- positive for stock in, negative for stock out
    quantity_after DECIMAL(10,3) NOT NULL,
    
    -- Cost Details
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    
    -- Reference Information
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    supplier_id UUID, -- Could reference suppliers table if created
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Transaction Notes
    notes TEXT,
    reason VARCHAR(100), -- 'damaged', 'expired', 'theft', etc.
    
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory alerts/notifications
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'expiring_soon', 'out_of_stock', 'over_stock'
    alert_level VARCHAR(20) DEFAULT 'warning', -- info, warning, critical
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES staff(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Inventory consumption tracking from menu items
CREATE TABLE IF NOT EXISTS menu_item_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    
    quantity_required DECIMAL(10,3) NOT NULL CHECK (quantity_required > 0),
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(menu_item_id, inventory_id)
);

-- Supplier management (optional enhancement)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    supplier_code VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    
    payment_terms VARCHAR(100),
    lead_time_days INT DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, supplier_code)
);

-- =====================
-- FUNCTIONS & TRIGGERS FOR INVENTORY
-- =====================

-- Function to generate inventory item code
CREATE OR REPLACE FUNCTION generate_inventory_item_code()
RETURNS TRIGGER AS $$
DECLARE
    category_prefix VARCHAR(10);
    item_count INT;
BEGIN
    -- Get first 3 letters of category name
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO category_prefix
    FROM inventory_categories
    WHERE id = NEW.category_id;
    
    -- Fallback if no category
    IF category_prefix IS NULL THEN
        category_prefix := 'INV';
    END IF;
    
    -- Count items in this category
    SELECT COUNT(*) + 1 INTO item_count
    FROM inventory
    WHERE hotel_id = NEW.hotel_id 
    AND category_id = NEW.category_id;
    
    NEW.item_code := category_prefix || '-' || LPAD(item_count::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update inventory status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on current quantity
    IF NEW.current_quantity <= 0 THEN
        NEW.status := 'out_of_stock';
    ELSIF NEW.current_quantity <= NEW.min_quantity THEN
        NEW.status := 'low_stock';
    ELSIF NEW.current_quantity >= COALESCE(NEW.max_quantity, NEW.min_quantity * 3) THEN
        NEW.status := 'over_stock';
    ELSE
        NEW.status := 'in_stock';
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle inventory transactions
CREATE OR REPLACE FUNCTION process_inventory_transaction()
RETURNS TRIGGER AS $$
DECLARE
    current_qty DECIMAL(10,3);
    new_status VARCHAR(20);
BEGIN
    -- Get current quantity
    SELECT current_quantity INTO current_qty
    FROM inventory
    WHERE id = NEW.inventory_id;
    
    -- Set before and after quantities
    NEW.quantity_before := current_qty;
    NEW.quantity_after := current_qty + NEW.quantity_change;
    
    -- Calculate total price if unit_price is provided
    IF NEW.unit_price IS NOT NULL THEN
        NEW.total_price := ABS(NEW.quantity_change) * NEW.unit_price;
    END IF;
    
    -- Update inventory quantity
    UPDATE inventory 
    SET current_quantity = NEW.quantity_after
    WHERE id = NEW.inventory_id;
    
    -- Create alert if stock is low after transaction
    IF NEW.quantity_after <= (SELECT min_quantity FROM inventory WHERE id = NEW.inventory_id) THEN
        INSERT INTO inventory_alerts (hotel_id, inventory_id, alert_type, alert_level, message)
        VALUES (
            NEW.hotel_id,
            NEW.inventory_id,
            'low_stock',
            'warning',
            'Inventory item is below minimum quantity'
        );
    END IF;
    
    -- Create alert if stock is out
    IF NEW.quantity_after <= 0 THEN
        INSERT INTO inventory_alerts (hotel_id, inventory_id, alert_type, alert_level, message)
        VALUES (
            NEW.hotel_id,
            NEW.inventory_id,
            'out_of_stock',
            'critical',
            'Inventory item is out of stock'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update consumption averages
CREATE OR REPLACE FUNCTION update_consumption_averages()
RETURNS TRIGGER AS $$
DECLARE
    daily_avg DECIMAL(10,3);
    monthly_avg DECIMAL(10,3);
BEGIN
    -- Update last consumption date
    UPDATE inventory 
    SET last_consumption_date = CURRENT_DATE
    WHERE id = NEW.inventory_id;
    
    -- Calculate daily consumption average (last 30 days)
    SELECT COALESCE(AVG(ABS(quantity_change)), 0) INTO daily_avg
    FROM inventory_transactions
    WHERE inventory_id = NEW.inventory_id
    AND transaction_type IN ('consumption', 'sale', 'wastage')
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculate monthly consumption average (last 6 months)
    SELECT COALESCE(AVG(ABS(quantity_change)), 0) INTO monthly_avg
    FROM inventory_transactions
    WHERE inventory_id = NEW.inventory_id
    AND transaction_type IN ('consumption', 'sale', 'wastage')
    AND transaction_date >= CURRENT_DATE - INTERVAL '180 days';
    
    -- Update consumption averages
    UPDATE inventory 
    SET daily_consumption_avg = daily_avg,
        monthly_consumption_avg = monthly_avg,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle order completion (deduct inventory)
CREATE OR REPLACE FUNCTION deduct_inventory_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    menu_item_record RECORD;
    inventory_item RECORD;
    required_qty DECIMAL(10,3);
BEGIN
    -- Only process when order is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- For each menu item in the order
        FOR menu_item_record IN 
            SELECT oi.menu_item_id, oi.quantity
            FROM order_items oi
            WHERE oi.order_id = NEW.id
        LOOP
            -- For each inventory item required for this menu item
            FOR inventory_item IN
                SELECT mii.inventory_id, mii.quantity_required, mii.unit
                FROM menu_item_inventory mii
                WHERE mii.menu_item_id = menu_item_record.menu_item_id
            LOOP
                -- Calculate required quantity
                required_qty := inventory_item.quantity_required * menu_item_record.quantity;
                
                -- Create consumption transaction
                INSERT INTO inventory_transactions (
                    hotel_id,
                    inventory_id,
                    transaction_type,
                    quantity_change,
                    order_id,
                    notes
                ) VALUES (
                    NEW.hotel_id,
                    inventory_item.inventory_id,
                    'consumption',
                    -required_qty, -- Negative for consumption
                    NEW.id,
                    'Consumed for order: ' || NEW.order_number
                );
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- TRIGGERS FOR INVENTORY
-- =====================

-- Generate inventory item code
CREATE TRIGGER generate_inventory_item_code_trigger
    BEFORE INSERT ON inventory
    FOR EACH ROW EXECUTE FUNCTION generate_inventory_item_code();

-- Update inventory status
CREATE TRIGGER update_inventory_status_trigger
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- Process inventory transactions
CREATE TRIGGER process_inventory_transaction_trigger
    BEFORE INSERT ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION process_inventory_transaction();

-- Update timestamps
CREATE TRIGGER update_inventory_categories_updated_at
    BEFORE UPDATE ON inventory_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_item_inventory_updated_at
    BEFORE UPDATE ON menu_item_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update consumption averages
CREATE TRIGGER update_consumption_averages_trigger
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW 
    WHEN (NEW.transaction_type IN ('consumption', 'sale', 'wastage'))
    EXECUTE FUNCTION update_consumption_averages();

-- Deduct inventory on order completion
CREATE TRIGGER deduct_inventory_on_order_completion_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_order_completion();



-- =====================
-- VIEWS FOR INVENTORY REPORTING
-- =====================

-- Low stock items view
CREATE OR REPLACE VIEW low_stock_inventory_view AS
SELECT 
    i.id,
    i.hotel_id,
    i.item_code,
    i.item_name,
    ic.name as category_name,
    i.current_quantity,
    i.min_quantity,
    i.unit,
    i.unit_cost,
    i.total_value,
    i.status,
    i.supplier_name,
    i.last_purchased_date,
    COALESCE(EXTRACT(DAY FROM AGE(CURRENT_DATE, i.last_purchased_date)), 0) as days_since_last_purchase,
    i.daily_consumption_avg,
    i.monthly_consumption_avg,
    CASE 
        WHEN i.daily_consumption_avg > 0 
        THEN ROUND(i.current_quantity / NULLIF(i.daily_consumption_avg, 0), 1)
        ELSE NULL 
    END as days_of_stock_remaining
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true 
AND i.current_quantity <= i.min_quantity
ORDER BY i.current_quantity / NULLIF(i.min_quantity, 1) ASC, i.item_name;

-- Expiring soon items view
CREATE OR REPLACE VIEW expiring_inventory_view AS
SELECT 
    i.id,
    i.hotel_id,
    i.item_code,
    i.item_name,
    ic.name as category_name,
    i.current_quantity,
    i.unit,
    i.expiry_date,
    i.unit_cost,
    i.total_value,
    EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) as days_until_expiry,
    CASE 
        WHEN EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) <= 7 THEN 'critical'
        WHEN EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) <= 30 THEN 'warning'
        ELSE 'normal'
    END as expiry_status
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true 
AND i.expiry_date IS NOT NULL
AND i.expiry_date >= CURRENT_DATE
AND i.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY i.expiry_date ASC;

-- Inventory valuation view
CREATE OR REPLACE VIEW inventory_valuation_view AS
SELECT 
    i.hotel_id,
    ic.name as category_name,
    COUNT(*) as item_count,
    SUM(i.current_quantity) as total_quantity,
    SUM(i.total_value) as total_value,
    AVG(i.unit_cost) as avg_unit_cost,
    SUM(CASE WHEN i.status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
    SUM(CASE WHEN i.status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
GROUP BY i.hotel_id, ic.name, ic.display_order
ORDER BY ic.display_order, ic.name;

-- Monthly consumption report view
CREATE OR REPLACE VIEW monthly_consumption_report AS
SELECT 
    i.hotel_id,
    DATE_TRUNC('month', it.transaction_date) as month,
    ic.name as category_name,
    i.item_name,
    SUM(ABS(it.quantity_change)) as total_consumption,
    AVG(ABS(it.quantity_change)) as avg_daily_consumption,
    SUM(it.total_price) as total_cost,
    COUNT(*) as transaction_count
FROM inventory_transactions it
JOIN inventory i ON it.inventory_id = i.id
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE it.transaction_type IN ('consumption', 'sale', 'wastage')
GROUP BY i.hotel_id, DATE_TRUNC('month', it.transaction_date), ic.name, i.item_name
ORDER BY month DESC, total_consumption DESC;

-- Inventory alerts summary view
CREATE OR REPLACE VIEW inventory_alerts_summary_view AS
SELECT 
    ia.hotel_id,
    ia.alert_type,
    ia.alert_level,
    COUNT(*) as alert_count,
    COUNT(CASE WHEN NOT ia.is_read THEN 1 END) as unread_count,
    COUNT(CASE WHEN NOT ia.is_resolved THEN 1 END) as unresolved_count,
    MIN(ia.created_at) as oldest_alert,
    MAX(ia.created_at) as latest_alert
FROM inventory_alerts ia
WHERE ia.expires_at > CURRENT_TIMESTAMP
GROUP BY ia.hotel_id, ia.alert_type, ia.alert_level
ORDER BY alert_level DESC, alert_count DESC;



CREATE TABLE if not exists activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID,
  user_type VARCHAR(20),

  action VARCHAR(100) NOT NULL,

  resource_type VARCHAR(50),
  resource_id UUID,

  details JSONB,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITHOUT TIME ZONE
    DEFAULT CURRENT_TIMESTAMP
);



-- added indexed for performance
-- =========================
-- HOTELS: dashboard filters, counts, recent hotels, plan distribution
-- =========================

CREATE INDEX IF NOT EXISTS idx_hotels_subscription_plan_id
ON hotels(subscription_plan_id);

CREATE INDEX IF NOT EXISTS idx_hotels_created_at_desc
ON hotels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hotels_is_active_created_at
ON hotels(is_active, created_at DESC);_logs

CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status_plan
ON hotels(subscription_status, subscription_plan_id);

CREATE INDEX IF NOT EXISTS idx_hotels_created_at_month
ON hotels (date_trunc('month', created_at));



-- =========================
-- STAFF: counts, recent activity by login, joins by hotel
-- =========================

CREATE INDEX IF NOT EXISTS idx_staff_last_login
ON staff(last_login DESC);

CREATE INDEX IF NOT EXISTS idx_staff_hotel_active
ON staff(hotel_id, is_active);

CREATE INDEX IF NOT EXISTS idx_staff_hotel_created_at
ON staff(hotel_id, created_at DESC);



-- =========================
-- ORDERS: this is the most important table for dashboard performance
-- =========================

-- Completed orders are queried repeatedly for revenue and recent orders
CREATE INDEX IF NOT EXISTS idx_orders_completed_created_at
ON orders(created_at DESC)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_orders_completed_hotel_created_at
ON orders(hotel_id, created_at DESC)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_orders_completed_created_date
ON orders((DATE(created_at)))
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_orders_completed_month
ON orders (date_trunc('month', created_at))
WHERE status = 'completed';

-- Helpful for recent orders query with hotel join + waiter join
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_hotel_status_created_at
ON orders(hotel_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_waiter_created_at
ON orders(waiter_id, created_at DESC);



-- =========================
-- HOTEL TABLES: top hotels and table statistics
-- =========================

CREATE INDEX IF NOT EXISTS idx_hotel_tables_hotel_status
ON hotel_tables(hotel_id, status);

CREATE INDEX IF NOT EXISTS idx_hotel_tables_status_hotel
ON hotel_tables(status, hotel_id);



-- =========================
-- MENU ITEMS / CATEGORIES: menu statistics
-- =========================

CREATE INDEX IF NOT EXISTS idx_menu_items_available
ON menu_items(is_available);

CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_available
ON menu_items(hotel_id, is_available);

CREATE INDEX IF NOT EXISTS idx_menu_categories_hotel
ON menu_categories(hotel_id);



-- =========================
-- INVENTORY: inventory stats
-- =========================

CREATE INDEX IF NOT EXISTS idx_inventory_active_status
ON inventory(is_active, status);

CREATE INDEX IF NOT EXISTS idx_inventory_hotel_active_status
ON inventory(hotel_id, is_active, status);



-- =========================
-- ACTIVITY LOGS: recent activity + system health
-- =========================

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc
ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type_created_at
ON activity_logs(user_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type_created_at
ON activity_logs(resource_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type_resource_id
ON activity_logs(resource_type, resource_id);

-- Best match for:
-- WHERE al.user_type = 'main_admin' OR al.resource_type IN (...)
CREATE INDEX IF NOT EXISTS idx_activity_logs_main_admin_recent
ON activity_logs(created_at DESC)
WHERE user_type = 'main_admin';

CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_recent
ON activity_logs(resource_type, created_at DESC)
WHERE resource_type IN ('hotel', 'subscription', 'order');








CREATE TABLE IF NOT EXISTS terms_and_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Type/Category
    type VARCHAR(50) NOT NULL DEFAULT 'platform', -- 'platform', 'hotel', 'privacy', 'cancellation'
    applies_to VARCHAR(50) NOT NULL DEFAULT 'all', -- 'all', 'hotels', 'customers', 'staff'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT true,
    
    -- Effective Period
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata (Ensure main_admins table exists before running)
    created_by UUID, 
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Info
    languages JSONB DEFAULT '{"en": true}',
    attachments JSONB DEFAULT '[]',
    
    -- Hotel specific
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT check_dates CHECK (effective_until IS NULL OR (effective_until > effective_from))
);

-- Unique constraint for Hotel-specific terms
CREATE UNIQUE INDEX idx_unique_hotel_version 
ON terms_and_conditions (version, type, hotel_id) 
WHERE hotel_id IS NOT NULL;

-- Unique constraint for Global/Platform terms
CREATE UNIQUE INDEX idx_unique_platform_version 
ON terms_and_conditions (version, type) 
WHERE hotel_id IS NULL;




CREATE TABLE IF NOT EXISTS user_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID NOT NULL REFERENCES terms_and_conditions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_type VARCHAR(50) NOT NULL, 
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(term_id, user_id, user_type)
);


-- Performance Indexes
CREATE INDEX idx_terms_lookup ON terms_and_conditions(type, is_active, hotel_id);
CREATE INDEX idx_terms_effective_range ON terms_and_conditions(effective_from, effective_until);
CREATE INDEX idx_acceptance_query ON user_terms_acceptance(user_id, user_type, term_id);

-- Apply the update trigger
DROP TRIGGER IF EXISTS trg_update_terms_updated_at ON terms_and_conditions;
CREATE TRIGGER trg_update_terms_updated_at
    BEFORE UPDATE ON terms_and_conditions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    