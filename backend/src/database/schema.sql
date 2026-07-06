
-- -- =====================
-- -- 1. CORE SYSTEM TABLES
-- -- =====================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- Main admin users (developers) - Separate from regular users
-- CREATE TABLE IF NOT EXISTS main_admin (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     full_name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last_login TIMESTAMP,
--     is_active BOOLEAN DEFAULT true
-- );

-- -- Registered users (not necessarily hotel admins yet)
-- CREATE TABLE IF NOT EXISTS registered_users (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     full_name VARCHAR(255) NOT NULL,
--     phone_number VARCHAR(50),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last_login TIMESTAMP,
--     email_verified BOOLEAN DEFAULT false,
--     is_active BOOLEAN DEFAULT true,
--     CONSTRAINT email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
-- );

-- -- Subscription plans (created by main admin)
-- CREATE TABLE IF NOT EXISTS subscription_plans (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     plan_name VARCHAR(100) NOT NULL,
--     description TEXT,
--     price_per_month DECIMAL(10,2) NOT NULL,
--     max_staff INT NOT NULL,
--     max_tables INT NOT NULL,
--     max_menu_items INT DEFAULT 100,
--     features JSONB DEFAULT '{}',
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     created_by UUID REFERENCES main_admins(id),
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Hotels (after user subscribes)
-- CREATE TABLE IF NOT EXISTS hotels (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     registered_user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
--     hotel_name VARCHAR(255) NOT NULL,
--     hotel_slug VARCHAR(100) UNIQUE NOT NULL, -- Unique slug for hotel login
--     phone_number VARCHAR(50),
--     address TEXT,
--     city VARCHAR(100),
--     country VARCHAR(100),
--     timezone VARCHAR(50) DEFAULT 'UTC',
--     currency VARCHAR(3) DEFAULT 'USD',
--     subscription_plan_id UUID REFERENCES subscription_plans(id),
--     subscription_status VARCHAR(20) DEFAULT 'inactive',
--     subscription_start_date DATE,
--     subscription_end_date DATE,
--     current_period_start DATE,
--     current_period_end DATE,
--     trial_ends_at DATE,
--     max_tables_allowed INT DEFAULT 20,
--     is_active BOOLEAN DEFAULT true,
--     settings JSONB DEFAULT '{}',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
--     CONSTRAINT valid_slug CHECK (hotel_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
--     CONSTRAINT subscription_dates_check 
--         CHECK (subscription_start_date IS NULL OR subscription_end_date IS NULL OR 
--                subscription_start_date <= subscription_end_date)
-- );

-- -- Hotel admin roles (mapping registered users to hotel admin role)
-- CREATE TABLE IF NOT EXISTS hotel_admins (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
--     is_primary_admin BOOLEAN DEFAULT true,
--     permissions JSONB DEFAULT '{"manage_staff": true, "manage_menu": true, "view_reports": true, "manage_subscription": true}',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(hotel_id, user_id)
-- );

-- -- =====================
-- -- 2. STAFF MANAGEMENT
-- -- =====================

-- -- Staff roles enum
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
--         CREATE TYPE staff_role AS ENUM (
--             'hotel_admin',
--             'receptionist',
--             'waiter',
--             'cook',
--             'kitchen_manager',
--             'cashier',
--             'cleaner'
--         );
--     END IF;
-- END$$;

-- -- Hotel staff (separate from registered_users)
-- CREATE TABLE IF NOT EXISTS staff (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     email VARCHAR(255) NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     staff_code VARCHAR(50) NOT NULL, -- Internal staff code (e.g., WA001)
--     full_name VARCHAR(255) NOT NULL,
--     role staff_role NOT NULL,
--     phone_number VARCHAR(50),
--     department VARCHAR(100),
--     permissions JSONB DEFAULT '{}',
--     can_login BOOLEAN DEFAULT true,
--     is_active BOOLEAN DEFAULT true,
--     last_login TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     created_by UUID REFERENCES hotel_admins(id),
    
--     UNIQUE(hotel_id, email),
--     UNIQUE(hotel_id, staff_code),
--     CONSTRAINT email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
-- );

-- -- Staff login credentials (for hotel-specific login using hotel_slug + staff_code)
-- CREATE TABLE IF NOT EXISTS staff_login (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     login_username VARCHAR(150) NOT NULL, -- Format: hotel_slug/staff_code
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
--     UNIQUE(login_username)
-- );

-- -- =====================
-- -- 3. SUBSCRIPTION & PAYMENTS
-- -- =====================

-- -- Subscription invoices
-- CREATE TABLE IF NOT EXISTS subscription_invoices (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     subscription_plan_id UUID REFERENCES subscription_plans(id),
--     invoice_number VARCHAR(50) UNIQUE NOT NULL,
--     amount DECIMAL(10,2) NOT NULL,
--     currency VARCHAR(3) DEFAULT 'USD',
--     status VARCHAR(20) DEFAULT 'pending',
--     billing_period_start DATE,
--     billing_period_end DATE,
--     due_date DATE NOT NULL,
--     paid_at TIMESTAMP,
--     payment_method VARCHAR(50),
--     transaction_id VARCHAR(255),
--     notes TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- =====================
-- -- 4. HOTEL OPERATIONS (REST AS BEFORE WITH IMPROVEMENTS)
-- -- =====================

-- -- Hotel tables
-- CREATE TABLE IF NOT EXISTS hotel_tables (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     table_number VARCHAR(50) NOT NULL,
--     table_name VARCHAR(100),
--     capacity INT NOT NULL CHECK (capacity > 0),
--     location VARCHAR(100),
--     status VARCHAR(20) DEFAULT 'available',
--     qr_code_url TEXT, -- QR code for table ordering
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(hotel_id, table_number)
-- );

-- -- Menu categories
-- CREATE TABLE IF NOT EXISTS menu_categories (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     name VARCHAR(100) NOT NULL,
--     description TEXT,
--     display_order INT DEFAULT 0,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(hotel_id, name)
-- );

-- -- Menu items
-- CREATE TABLE IF NOT EXISTS menu_items (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
--     item_code VARCHAR(50) NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
--     cost_price DECIMAL(10,2),
--     preparation_time INT CHECK (preparation_time >= 0),
--     is_available BOOLEAN DEFAULT true,
--     is_popular BOOLEAN DEFAULT false,
--     has_variants BOOLEAN DEFAULT false,
--     variants JSONB DEFAULT '[]',
--     dietary_info JSONB DEFAULT '{}',
--     image_url TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(hotel_id, item_code)
-- );

-- -- =====================
-- -- 5. ORDER MANAGEMENT (WITH IMPROVEMENTS)
-- -- =====================

-- -- Order status enum
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
--         CREATE TYPE order_status AS ENUM (
--             'pending',
--             'confirmed',
--             'preparing',
--             'ready',
--             'served',
--             'cancelled',
--             'paid'
--         );
--     END IF;
-- END$$;

-- -- Payment status enum
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
--         CREATE TYPE payment_status AS ENUM (
--             'pending',
--             'partially_paid',
--             'paid',
--             'refunded',
--             'failed'
--         );
--     END IF;
-- END$$;

-- -- Orders
-- CREATE TABLE IF NOT EXISTS orders (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
--     order_number VARCHAR(50) NOT NULL,
--     table_id UUID REFERENCES hotel_tables(id) ON DELETE SET NULL,
--     customer_name VARCHAR(255),
--     customer_phone VARCHAR(50),
--     waiter_id UUID REFERENCES staff(id),
--     subtotal DECIMAL(10,2) DEFAULT 0,
--     tax_amount DECIMAL(10,2) DEFAULT 0,
--     discount_amount DECIMAL(10,2) DEFAULT 0,
--     total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
--     status order_status DEFAULT 'pending',
--     payment_status payment_status DEFAULT 'pending',
--     special_instructions TEXT,
--     order_type VARCHAR(20) DEFAULT 'dine_in',
--     payment_method VARCHAR(50),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     kitchen_notes TEXT,
--     served_at TIMESTAMP,
--     paid_at TIMESTAMP,
--     UNIQUE(hotel_id, order_number)
-- );

-- -- Order items
-- CREATE TABLE IF NOT EXISTS order_items (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
--     menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
--     item_name VARCHAR(255) NOT NULL,
--     quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
--     unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
--     total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
--     special_instructions TEXT,
--     status VARCHAR(20) DEFAULT 'pending',
--     prepared_by UUID REFERENCES staff(id),
--     prepared_at TIMESTAMP,
--     served_by UUID REFERENCES staff(id),
--     served_at TIMESTAMP,
--     cancelled_by UUID REFERENCES staff(id),
--     cancelled_at TIMESTAMP,
--     cancellation_reason TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
--     CHECK ((cancelled_at IS NULL AND cancelled_by IS NULL AND cancellation_reason IS NULL) OR 
--            (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
-- );

-- -- =====================
-- -- 6. ENHANCED FUNCTIONS & TRIGGERS
-- -- =====================

-- -- Function to update updated_at timestamp
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- Function to generate order number with hotel prefix
-- CREATE OR REPLACE FUNCTION generate_order_number()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     hotel_slug_text VARCHAR(100);
--     order_count INT;
-- BEGIN
--     -- Get hotel slug
--     SELECT hotel_slug INTO hotel_slug_text
--     FROM hotels WHERE id = NEW.hotel_id;
    
--     -- Count today's orders for this hotel
--     SELECT COUNT(*) + 1 INTO order_count
--     FROM orders
--     WHERE hotel_id = NEW.hotel_id 
--     AND DATE(created_at) = CURRENT_DATE;
    
--     -- Generate order number: SLUG-YYYYMMDD-0001
--     NEW.order_number := UPPER(hotel_slug_text) || '-' || 
--                        TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
--                        LPAD(order_count::TEXT, 4, '0');
    
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- Function to generate staff code
-- CREATE OR REPLACE FUNCTION generate_staff_code()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     role_prefix VARCHAR(2);
--     staff_count INT;
-- BEGIN
--     -- Generate prefix based on role
--     CASE NEW.role
--         WHEN 'waiter' THEN role_prefix := 'WA';
--         WHEN 'cook' THEN role_prefix := 'CK';
--         WHEN 'receptionist' THEN role_prefix := 'RC';
--         WHEN 'cashier' THEN role_prefix := 'CA';
--         WHEN 'kitchen_manager' THEN role_prefix := 'KM';
--         WHEN 'cleaner' THEN role_prefix := 'CL';
--         ELSE role_prefix := 'ST';
--     END CASE;
    
--     -- Count staff with same role in this hotel
--     SELECT COUNT(*) + 1 INTO staff_count
--     FROM staff
--     WHERE hotel_id = NEW.hotel_id 
--     AND role = NEW.role;
    
--     NEW.staff_code := role_prefix || LPAD(staff_count::TEXT, 3, '0');
    
--     -- Also create login username
--     INSERT INTO staff_login (staff_id, hotel_id, login_username)
--     VALUES (
--         NEW.id,
--         NEW.hotel_id,
--         (SELECT hotel_slug FROM hotels WHERE id = NEW.hotel_id) || '/' || NEW.staff_code
--     );
    
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- Function to update order total when items change
-- CREATE OR REPLACE FUNCTION update_order_total()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'DELETE' THEN
--         UPDATE orders o
--         SET total_amount = (
--             SELECT COALESCE(SUM(total_price), 0)
--             FROM order_items
--             WHERE order_id = OLD.order_id
--         ),
--         subtotal = (
--             SELECT COALESCE(SUM(total_price), 0)
--             FROM order_items
--             WHERE order_id = OLD.order_id
--         )
--         WHERE id = OLD.order_id;
--     ELSE
--         UPDATE orders o
--         SET total_amount = (
--             SELECT COALESCE(SUM(total_price), 0)
--             FROM order_items
--             WHERE order_id = NEW.order_id
--         ),
--         subtotal = (
--             SELECT COALESCE(SUM(total_price), 0)
--             FROM order_items
--             WHERE order_id = NEW.order_id
--         )
--         WHERE id = NEW.order_id;
--     END IF;
    
--     RETURN COALESCE(NEW, OLD);
-- END;
-- $$ language 'plpgsql';

-- -- Function to check subscription limits
-- CREATE OR REPLACE FUNCTION check_subscription_limits()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     current_staff_count INT;
--     max_staff_allowed INT;
--     current_table_count INT;
--     max_tables_allowed INT;
--     current_menu_items_count INT;
--     max_menu_items_allowed INT;
-- BEGIN
--     -- Check staff limits
--     IF TG_TABLE_NAME = 'staff' THEN
--         SELECT COUNT(*) INTO current_staff_count
--         FROM staff
--         WHERE hotel_id = NEW.hotel_id AND is_active = true;
        
--         SELECT sp.max_staff INTO max_staff_allowed
--         FROM hotels h
--         JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
--         WHERE h.id = NEW.hotel_id;
        
--         IF current_staff_count > max_staff_allowed THEN
--             RAISE EXCEPTION 'Staff limit exceeded. Maximum allowed: %', max_staff_allowed;
--         END IF;
--     END IF;
    
--     -- Check table limits
--     IF TG_TABLE_NAME = 'hotel_tables' THEN
--         SELECT COUNT(*) INTO current_table_count
--         FROM hotel_tables
--         WHERE hotel_id = NEW.hotel_id;
        
--         SELECT sp.max_tables INTO max_tables_allowed
--         FROM hotels h
--         JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
--         WHERE h.id = NEW.hotel_id;
        
--         IF current_table_count > max_tables_allowed THEN
--             RAISE EXCEPTION 'Table limit exceeded. Maximum allowed: %', max_tables_allowed;
--         END IF;
--     END IF;
    
--     -- Check menu items limits
--     IF TG_TABLE_NAME = 'menu_items' THEN
--         SELECT COUNT(*) INTO current_menu_items_count
--         FROM menu_items
--         WHERE hotel_id = NEW.hotel_id;
        
--         SELECT sp.max_menu_items INTO max_menu_items_allowed
--         FROM hotels h
--         JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
--         WHERE h.id = NEW.hotel_id;
        
--         IF current_menu_items_count > max_menu_items_allowed THEN
--             RAISE EXCEPTION 'Menu items limit exceeded. Maximum allowed: %', max_menu_items_allowed;
--         END IF;
--     END IF;
    
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- -- =====================
-- -- 7. TRIGGERS
-- -- =====================

-- -- Update timestamps triggers
-- CREATE TRIGGER update_hotels_updated_at 
--     BEFORE UPDATE ON hotels 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_staff_updated_at 
--     BEFORE UPDATE ON staff 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_orders_updated_at 
--     BEFORE UPDATE ON orders 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_menu_items_updated_at 
--     BEFORE UPDATE ON menu_items 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_subscription_plans_updated_at 
--     BEFORE UPDATE ON subscription_plans 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_subscription_invoices_updated_at 
--     BEFORE UPDATE ON subscription_invoices 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- Order number generation trigger
-- CREATE TRIGGER generate_order_number_trigger 
--     BEFORE INSERT ON orders 
--     FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- -- Staff code generation trigger
-- CREATE TRIGGER generate_staff_code_trigger 
--     BEFORE INSERT ON staff 
--     FOR EACH ROW EXECUTE FUNCTION generate_staff_code();

-- -- Order total update triggers
-- CREATE TRIGGER update_order_total_insert
--     AFTER INSERT ON order_items
--     FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- CREATE TRIGGER update_order_total_update
--     AFTER UPDATE ON order_items
--     FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- CREATE TRIGGER update_order_total_delete
--     AFTER DELETE ON order_items
--     FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- -- Subscription limits check triggers
-- CREATE TRIGGER check_staff_limits
--     BEFORE INSERT ON staff
--     FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();

-- CREATE TRIGGER check_table_limits
--     BEFORE INSERT ON hotel_tables
--     FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();

-- CREATE TRIGGER check_menu_items_limits
--     BEFORE INSERT ON menu_items
--     FOR EACH ROW EXECUTE FUNCTION check_subscription_limits();

-- -- =====================
-- -- 8. INDEXES FOR PERFORMANCE
-- -- =====================

-- -- Hotel indexes
-- CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(hotel_slug);
-- CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status ON hotels(subscription_status);
-- CREATE INDEX IF NOT EXISTS idx_hotels_subscription_end_date ON hotels(subscription_end_date);
-- CREATE INDEX IF NOT EXISTS idx_hotels_registered_user ON hotels(registered_user_id);

-- -- Registered users indexes
-- CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
-- CREATE INDEX IF NOT EXISTS idx_registered_users_is_active ON registered_users(is_active);

-- -- Hotel admins indexes
-- CREATE INDEX IF NOT EXISTS idx_hotel_admins_hotel ON hotel_admins(hotel_id);
-- CREATE INDEX IF NOT EXISTS idx_hotel_admins_user ON hotel_admins(user_id);

-- -- Staff indexes
-- CREATE INDEX IF NOT EXISTS idx_staff_hotel_id ON staff(hotel_id);
-- CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
-- CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
-- CREATE INDEX IF NOT EXISTS idx_staff_staff_code ON staff(staff_code);
-- CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- -- Staff login indexes
-- CREATE INDEX IF NOT EXISTS idx_staff_login_username ON staff_login(login_username);
-- CREATE INDEX IF NOT EXISTS idx_staff_login_staff ON staff_login(staff_id);

-- -- Order indexes
-- CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON orders(hotel_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
-- CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
-- CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- -- Order items indexes
-- CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
-- CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- -- Subscription invoices indexes
-- CREATE INDEX IF NOT EXISTS idx_invoices_hotel ON subscription_invoices(hotel_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
-- CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON subscription_invoices(due_date);

-- -- =====================
-- -- 9. VIEWS
-- -- =====================

-- -- View for hotel subscription overview
-- CREATE OR REPLACE VIEW hotel_subscription_overview AS
-- SELECT 
--     h.id as hotel_id,
--     h.hotel_name,
--     h.hotel_slug,
--     h.subscription_status,
--     h.subscription_start_date,
--     h.subscription_end_date,
--     sp.plan_name,
--     sp.price_per_month,
--     (SELECT COUNT(*) FROM staff s WHERE s.hotel_id = h.id AND s.is_active = true) as active_staff_count,
--     sp.max_staff,
--     (SELECT COUNT(*) FROM hotel_tables ht WHERE ht.hotel_id = h.id) as table_count,
--     sp.max_tables,
--     (SELECT COUNT(*) FROM menu_items mi WHERE mi.hotel_id = h.id) as menu_items_count,
--     sp.max_menu_items,
--     CASE 
--         WHEN h.subscription_end_date < CURRENT_DATE THEN 'expired'
--         WHEN h.subscription_end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
--         ELSE 'active'
--     END as subscription_health
-- FROM hotels h
-- JOIN subscription_plans sp ON h.subscription_plan_id = sp.id
-- WHERE h.is_active = true;

-- -- View for today's orders summary
-- CREATE OR REPLACE VIEW todays_orders_summary AS
-- SELECT 
--     o.hotel_id,
--     COUNT(*) as total_orders,
--     COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
--     COUNT(CASE WHEN o.status = 'preparing' THEN 1 END) as preparing_orders,
--     COUNT(CASE WHEN o.status = 'ready' THEN 1 END) as ready_orders,
--     COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders,
--     SUM(o.total_amount) as total_revenue
-- FROM orders o
-- WHERE DATE(o.created_at) = CURRENT_DATE
-- GROUP BY o.hotel_id;

-- -- View for staff login information
-- CREATE OR REPLACE VIEW staff_login_info AS
-- SELECT 
--     s.id as staff_id,
--     s.hotel_id,
--     s.staff_code,
--     s.full_name,
--     s.role,
--     sl.login_username,
--     h.hotel_slug,
--     h.hotel_name
-- FROM staff s
-- JOIN staff_login sl ON s.id = sl.staff_id
-- JOIN hotels h ON s.hotel_id = h.id
-- WHERE s.is_active = true AND s.can_login = true AND sl.is_active = true;

-- -- =====================
-- -- 10. INITIAL DATA (OPTIONAL)
-- -- =====================

-- -- Insert default subscription plans (can be modified by main admin)
-- INSERT INTO subscription_plans (id, plan_name, description, price_per_month, max_staff, max_tables, max_menu_items, features) VALUES
-- (uuid_generate_v4(), 'Basic', 'For small hotels and restaurants', 49.99, 5, 10, 50, '{"online_ordering": false, "analytics": false, "multi_branch": false}'),
-- (uuid_generate_v4(), 'Standard', 'For medium-sized establishments', 99.99, 15, 30, 200, '{"online_ordering": true, "analytics": true, "multi_branch": false}'),
-- (uuid_generate_v4(), 'Premium', 'For large hotels and chains', 199.99, 50, 100, 500, '{"online_ordering": true, "analytics": true, "multi_branch": true, "custom_domain": true}')
-- ON CONFLICT DO NOTHING;






-- =====================
-- 1. CORE SYSTEM TABLES
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Platform admins (SaaS owners/developers)
CREATE TABLE IF NOT EXISTS platform_admins (
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
    price_per_month DECIMAL(10,2) NOT NULL,
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
    trial_ends_at DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    
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

CREATE TYPE staff_role_enum AS ENUM (
    'manager',
    'receptionist',
    'waiter',
    'cashier',
    'cook',
    'chef',
    'cleaner'
);

-- Staff members for each hotel
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Staff Details
    staff_code VARCHAR(50) NOT NULL, -- e.g., WA001, CK001
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    
    -- Role & Permissions
    role staff_role_enum NOT NULL,
    pin_code VARCHAR(6), -- For POS login
    permissions JSONB DEFAULT '{
        "take_orders": true,
        "process_payments": false,
        "view_reports": false,
        "manage_menu": false,
        "manage_staff": false
    }',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hotel_id, staff_code),
    UNIQUE(hotel_id, pin_code) WHERE pin_code IS NOT NULL
);

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
CREATE INDEX idx_platform_admins_email ON platform_admins(email);
CREATE INDEX idx_platform_admins_active ON platform_admins(is_active);

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
INSERT INTO platform_admins (id, email, password_hash, full_name) VALUES
(
    uuid_generate_v4(),
    'admin@hotelsaas.com',
    -- Password: Admin123! (change this in production)
    '$2a$12$YourHashedPasswordHere',
    'Platform Administrator'
)
ON CONFLICT (email) DO NOTHING;