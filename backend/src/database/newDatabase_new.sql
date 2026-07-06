CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hotel_user_role_enum') THEN
        CREATE TYPE hotel_user_role_enum AS ENUM (
            'hotel_admin',
            'manager',
            'receptionist',
            'billing',
            'waiter',
            'kitchen',
            'inventory'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM (
            'pending',
            'confirmed',
            'preparing',
            'ready',
            'served',
            'cancelled',
            'completed'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM (
            'pending',
            'partial',
            'paid',
            'refunded'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transaction_type') THEN
        CREATE TYPE inventory_transaction_type AS ENUM (
            'purchase',
            'sale',
            'adjustment',
            'wastage',
            'transfer',
            'production',
            'consumption'
        );
    END IF;
END$$;

-- =========================================================
-- CORE TABLES
-- =========================================================

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

CREATE INDEX IF NOT EXISTS idx_main_admins_email ON main_admins(email);
CREATE INDEX IF NOT EXISTS idx_main_admins_active ON main_admins(is_active);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_per_year DECIMAL(10,2) NOT NULL,
    price_per_month DECIMAL(10,2) GENERATED ALWAYS AS (price_per_year / 12) STORED,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'yearly',
    max_staff INT NOT NULL,
    max_tables INT NOT NULL,
    max_menu_items INT NOT NULL,
    features JSONB DEFAULT '{}',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- =========================================================
-- HOTELS (NO ADMIN LOGIN FIELDS HERE ANYMORE)
-- =========================================================

CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    hotel_name VARCHAR(255) NOT NULL,
    hotel_slug VARCHAR(100) UNIQUE NOT NULL,
    hotel_img TEXT DEFAULT 'https://freesvg.org/img/abstract-user-flat-4.png',

    hotel_phone VARCHAR(50),
    hotel_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',

    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    service_charge DECIMAL(5,2) DEFAULT 5.00,

    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    billing_cycle VARCHAR(20) DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    registration_type VARCHAR(20) DEFAULT 'subscription' CHECK (registration_type IN ('trial', 'subscription')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('esewa', 'khalti', 'fonepay', 'card')),

    subscription_status VARCHAR(20) DEFAULT 'pending' CHECK (
        subscription_status IN ('pending', 'trial', 'active', 'suspended', 'cancelled', 'expired', 'trial_expired')
    ),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
    ),

    subscription_start_date DATE,
    subscription_end_date DATE,
    trial_starts_at DATE,
    trial_ends_at DATE,

    max_staff_allowed INT DEFAULT 5,
    max_tables_allowed INT DEFAULT 20,
    max_menu_items_allowed INT DEFAULT 100,

    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,

    accept_marketing BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(hotel_slug);
CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status ON hotels(subscription_status);
CREATE INDEX IF NOT EXISTS idx_hotels_payment_status ON hotels(payment_status);
CREATE INDEX IF NOT EXISTS idx_hotels_subscription_plan_id ON hotels(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_hotels_billing_cycle ON hotels(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_hotels_registration_type ON hotels(registration_type);
CREATE INDEX IF NOT EXISTS idx_hotels_payment_method ON hotels(payment_method);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at_month ON hotels (date_trunc('month', created_at));
CREATE INDEX IF NOT EXISTS idx_hotels_is_active_created_at ON hotels(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status_plan ON hotels(subscription_status, subscription_plan_id);

-- =========================================================
-- USERS (REPLACES ADMIN-IN-HOTEL + STAFF TABLE)
-- =========================================================
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  fcm_token TEXT NOT NULL,

  platform VARCHAR(20), -- android / ios / web

  is_active BOOLEAN DEFAULT true,

  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,

    role hotel_user_role_enum NOT NULL DEFAULT 'waiter',
    staff_code VARCHAR(50),
    profile_image TEXT,
    recovery_email VARCHAR(255),

    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,

    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,

    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    temp_reset_token VARCHAR(255),
    temp_reset_expires TIMESTAMP,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_email_per_hotel UNIQUE (hotel_id, email),
    CONSTRAINT unique_staff_code_per_hotel UNIQUE (hotel_id, staff_code)
);

CREATE INDEX IF NOT EXISTS idx_users_hotel_id ON users(hotel_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_staff_code ON users(staff_code);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_hotel_role ON users(hotel_id, role);
CREATE INDEX IF NOT EXISTS idx_users_hotel_active ON users(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_hotel_created_at ON users(hotel_id, created_at DESC);

-- =========================================================
-- MENU
-- =========================================================

CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, name)
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_hotel_id ON menu_categories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_display_order ON menu_categories(display_order);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    item_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    preparation_time INT,
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_vegetarian BOOLEAN DEFAULT false,
    dietary_info TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_id ON menu_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_item_code ON menu_items(item_code);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_popular ON menu_items(is_popular);
CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_available ON menu_items(hotel_id, is_available);

-- =========================================================
-- TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS hotel_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    capacity INT NOT NULL CHECK (capacity > 0),
    floor_number INT DEFAULT 1,
    section VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available',
    qr_code_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_hotel_tables_hotel_id ON hotel_tables(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_tables_table_number ON hotel_tables(table_number);
CREATE INDEX IF NOT EXISTS idx_hotel_tables_status ON hotel_tables(status);
CREATE INDEX IF NOT EXISTS idx_hotel_tables_hotel_status ON hotel_tables(hotel_id, status);

-- =========================================================
-- ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL, -- cash, card, qr, fonepay
    payment_status VARCHAR(30) NOT NULL DEFAULT 'success', -- pending, success, failed, refunded
    transaction_ref VARCHAR(255),
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_hotel_status_created_at ON orders(hotel_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    prepared_by UUID REFERENCES users(id) ON DELETE SET NULL,
    prepared_at TIMESTAMP,
    served_by UUID REFERENCES users(id) ON DELETE SET NULL,
    served_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
table_id UUID REFERENCES hotel_tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status order_status_enum DEFAULT 'pending',
    payment_status payment_status_enum DEFAULT 'pending',
    payment_method VARCHAR(50),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    special_instructions TEXT,
    kitchen_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    served_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(hotel_id, order_number)
);
CREATE TABLE IF NOT EXISTS order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- =========================================================
-- REGISTRATION / BILLING
-- =========================================================

CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    hotel_name VARCHAR(255) NOT NULL,
    hotel_slug VARCHAR(100) NOT NULL UNIQUE,
    hotel_phone VARCHAR(50),
    hotel_email VARCHAR(255),
    hotel_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    hotel_img TEXT DEFAULT 'https://freesvg.org/img/abstract-user-flat-4.png',

    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    service_charge DECIMAL(5,2) DEFAULT 5.00,

    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50),
    owner_password_hash VARCHAR(255) NOT NULL,
    recovery_email VARCHAR(255),

    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    registration_type VARCHAR(20) NOT NULL DEFAULT 'subscription' CHECK (registration_type IN ('trial', 'subscription')),

    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('esewa', 'khalti', 'fonepay', 'card')),
    payment_provider VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    transaction_uuid VARCHAR(255) UNIQUE,
    provider_reference VARCHAR(255),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled')
    ),

    accept_terms BOOLEAN NOT NULL DEFAULT false,
    accept_marketing BOOLEAN NOT NULL DEFAULT false,

    expires_at TIMESTAMP,
    paid_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_owner_email ON pending_registrations(owner_email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_hotel_slug ON pending_registrations(hotel_slug);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_subscription_plan_id ON pending_registrations(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_transaction_uuid ON pending_registrations(transaction_uuid);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_payment_status ON pending_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_created_at ON pending_registrations(created_at DESC);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    pending_registration_id UUID REFERENCES pending_registrations(id) ON DELETE SET NULL,
    hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,

    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    registration_type VARCHAR(20) NOT NULL CHECK (registration_type IN ('trial', 'subscription')),

    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('esewa', 'khalti', 'fonepay', 'card')),
    provider VARCHAR(50) NOT NULL,

    transaction_uuid VARCHAR(255) NOT NULL UNIQUE,
    provider_reference VARCHAR(255) UNIQUE,

    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'refunded')
    ),

    paid_at TIMESTAMP,
    failed_at TIMESTAMP,
    refunded_at TIMESTAMP,

    raw_response JSONB DEFAULT '{}'::jsonb,
    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_pending_registration_id ON payments(pending_registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_hotel_id ON payments(hotel_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_plan_id ON payments(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    billing_period_start DATE,
    billing_period_end DATE,
    due_date DATE,

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_hotel_id ON subscription_invoices(hotel_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_invoice_number ON subscription_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_payment_id ON subscription_invoices(payment_id);

-- =========================================================
-- INVENTORY
-- =========================================================

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

CREATE INDEX IF NOT EXISTS idx_inventory_categories_hotel_id ON inventory_categories(hotel_id);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    current_quantity DECIMAL(10,3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    min_quantity DECIMAL(10,3) NOT NULL DEFAULT 10 CHECK (min_quantity >= 0),
    max_quantity DECIMAL(10,3) CHECK (max_quantity >= 0),
    unit VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (current_quantity * unit_cost) STORED,
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(100),
    supplier_price DECIMAL(10,2),
    last_purchased_date DATE,
    reorder_point DECIMAL(10,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_stock',
    is_active BOOLEAN DEFAULT true,
    location VARCHAR(100),
    barcode VARCHAR(100),
    expiry_date DATE,
    daily_consumption_avg DECIMAL(10,3) DEFAULT 0,
    monthly_consumption_avg DECIMAL(10,3) DEFAULT 0,
    last_consumption_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_inventory_hotel_id ON inventory(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_active_status ON inventory(is_active, status);
CREATE INDEX IF NOT EXISTS idx_inventory_hotel_active_status ON inventory(hotel_id, is_active, status);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type inventory_transaction_type NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    quantity_before DECIMAL(10,3) NOT NULL,
    quantity_change DECIMAL(10,3) NOT NULL,
    quantity_after DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    supplier_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    reason VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_hotel_id ON inventory_transactions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_id ON inventory_transactions(order_id);

CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    alert_level VARCHAR(20) DEFAULT 'warning',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_hotel_id ON inventory_alerts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_inventory_id ON inventory_alerts(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);

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

CREATE INDEX IF NOT EXISTS idx_menu_item_inventory_hotel_id ON menu_item_inventory(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_inventory_menu_item_id ON menu_item_inventory(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_inventory_inventory_id ON menu_item_inventory(inventory_id);

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

CREATE INDEX IF NOT EXISTS idx_suppliers_hotel_id ON suppliers(hotel_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);

-- =========================================================
-- TERMS / LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS terms_and_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'platform',
    applies_to VARCHAR(50) NOT NULL DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT true,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    languages JSONB DEFAULT '{"en": true}',
    attachments JSONB DEFAULT '[]',
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT check_dates CHECK (effective_until IS NULL OR (effective_until > effective_from))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_hotel_version
ON terms_and_conditions (version, type, hotel_id)
WHERE hotel_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_platform_version
ON terms_and_conditions (version, type)
WHERE hotel_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_terms_lookup ON terms_and_conditions(type, is_active, hotel_id);
CREATE INDEX IF NOT EXISTS idx_terms_effective_range ON terms_and_conditions(effective_from, effective_until);

CREATE TABLE IF NOT EXISTS user_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID NOT NULL REFERENCES terms_and_conditions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    UNIQUE(term_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_acceptance_query ON user_terms_acceptance(user_id, term_id);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100),
    user_id UUID,
    user_type VARCHAR(20),
    hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_hotel_id ON activity_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type_created_at ON activity_logs(user_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type_created_at ON activity_logs(resource_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type_resource_id ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);

-- =========================================================
-- FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_user_staff_code()
RETURNS TRIGGER AS $$
DECLARE
    role_prefix VARCHAR(3);
    user_count INT;
BEGIN
    IF NEW.staff_code IS NOT NULL AND NEW.staff_code <> '' THEN
        RETURN NEW;
    END IF;

    CASE NEW.role::text
        WHEN 'hotel_admin' THEN role_prefix := 'ADM';
        WHEN 'manager' THEN role_prefix := 'MGR';
        WHEN 'receptionist' THEN role_prefix := 'REC';
        WHEN 'billing' THEN role_prefix := 'BIL';
        WHEN 'waiter' THEN role_prefix := 'WTR';
        WHEN 'kitchen' THEN role_prefix := 'KIT';
        WHEN 'inventory' THEN role_prefix := 'INV';
        ELSE role_prefix := 'USR';
    END CASE;

    SELECT COUNT(*) + 1 INTO user_count
    FROM users
    WHERE hotel_id = NEW.hotel_id
      AND role = NEW.role;

    NEW.staff_code := role_prefix || LPAD(user_count::TEXT, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_menu_item_code()
RETURNS TRIGGER AS $$
DECLARE
    category_prefix VARCHAR(10);
    next_number INT;
BEGIN
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO category_prefix
    FROM menu_categories
    WHERE id = NEW.category_id;

    IF category_prefix IS NULL THEN
        category_prefix := 'GEN';
    END IF;

    SELECT COALESCE(MAX(CAST(SPLIT_PART(item_code, '-', 2) AS INT)), 0) + 1
    INTO next_number
    FROM menu_items
    WHERE hotel_id = NEW.hotel_id
      AND item_code LIKE category_prefix || '-%';

    NEW.item_code := category_prefix || '-' || LPAD(next_number::TEXT, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
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

    UPDATE orders o
    SET
        tax_amount = ROUND(o.subtotal * h.tax_rate / 100, 2),
        service_charge = ROUND(o.subtotal * h.service_charge / 100, 2),
        total_amount = o.subtotal +
                       ROUND(o.subtotal * h.tax_rate / 100, 2) +
                       ROUND(o.subtotal * h.service_charge / 100, 2) -
                       o.discount_amount
    FROM hotels h
    WHERE o.id = COALESCE(NEW.order_id, OLD.order_id)
      AND o.hotel_id = h.id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_inventory_item_code()
RETURNS TRIGGER AS $$
DECLARE
    category_prefix VARCHAR(10);
    item_count INT;
BEGIN
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO category_prefix
    FROM inventory_categories
    WHERE id = NEW.category_id;

    IF category_prefix IS NULL THEN
        category_prefix := 'INV';
    END IF;

    SELECT COUNT(*) + 1 INTO item_count
    FROM inventory
    WHERE hotel_id = NEW.hotel_id
      AND category_id = NEW.category_id;

    NEW.item_code := category_prefix || '-' || LPAD(item_count::TEXT, 4, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_quantity <= 0 THEN
        NEW.status := 'out_of_stock';
    ELSIF NEW.current_quantity <= NEW.min_quantity THEN
        NEW.status := 'low_stock';
    ELSIF NEW.max_quantity IS NOT NULL AND NEW.current_quantity >= NEW.max_quantity THEN
        NEW.status := 'over_stock';
    ELSE
        NEW.status := 'in_stock';
    END IF;

    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_inventory_transaction()
RETURNS TRIGGER AS $$
DECLARE
    current_qty DECIMAL(10,3);
BEGIN
    SELECT current_quantity INTO current_qty
    FROM inventory
    WHERE id = NEW.inventory_id;

    NEW.quantity_before := current_qty;
    NEW.quantity_after := current_qty + NEW.quantity_change;

    IF NEW.unit_price IS NOT NULL THEN
        NEW.total_price := ABS(NEW.quantity_change) * NEW.unit_price;
    END IF;

    UPDATE inventory
    SET current_quantity = NEW.quantity_after
    WHERE id = NEW.inventory_id;

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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_consumption_averages()
RETURNS TRIGGER AS $$
DECLARE
    daily_avg DECIMAL(10,3);
    monthly_avg DECIMAL(10,3);
BEGIN
    UPDATE inventory
    SET last_consumption_date = CURRENT_DATE
    WHERE id = NEW.inventory_id;

    SELECT COALESCE(AVG(ABS(quantity_change)), 0) INTO daily_avg
    FROM inventory_transactions
    WHERE inventory_id = NEW.inventory_id
      AND transaction_type IN ('consumption', 'sale', 'wastage')
      AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';

    SELECT COALESCE(AVG(ABS(quantity_change)), 0) INTO monthly_avg
    FROM inventory_transactions
    WHERE inventory_id = NEW.inventory_id
      AND transaction_type IN ('consumption', 'sale', 'wastage')
      AND transaction_date >= CURRENT_DATE - INTERVAL '180 days';

    UPDATE inventory
    SET daily_consumption_avg = daily_avg,
        monthly_consumption_avg = monthly_avg,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_inventory_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
    menu_item_record RECORD;
    inventory_item RECORD;
    required_qty DECIMAL(10,3);
BEGIN
    IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
        FOR menu_item_record IN
            SELECT oi.menu_item_id, oi.quantity
            FROM order_items oi
            WHERE oi.order_id = NEW.id
        LOOP
            FOR inventory_item IN
                SELECT mii.inventory_id, mii.quantity_required, mii.unit
                FROM menu_item_inventory mii
                WHERE mii.menu_item_id = menu_item_record.menu_item_id
            LOOP
                required_qty := inventory_item.quantity_required * menu_item_record.quantity;

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
                    -required_qty,
                    NEW.id,
                    'Consumed for order: ' || NEW.order_number
                );
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- VIEWS
-- =========================================================

CREATE OR REPLACE VIEW hotel_dashboard_stats AS
SELECT
    h.id AS hotel_id,
    h.hotel_name,
    h.hotel_slug,
    h.subscription_status,
    h.subscription_end_date,
    h.registration_type,
    h.trial_ends_at,
    h.payment_status,
    (SELECT COUNT(*) FROM users u WHERE u.hotel_id = h.id AND u.is_active = true) AS active_user_count,
    h.max_staff_allowed,
    (SELECT COUNT(*) FROM hotel_tables t WHERE t.hotel_id = h.id) AS table_count,
    (SELECT COUNT(*) FROM hotel_tables t WHERE t.hotel_id = h.id AND t.status = 'available') AS available_tables,
    h.max_tables_allowed,
    (SELECT COUNT(*) FROM menu_items m WHERE m.hotel_id = h.id) AS menu_items_count,
    (SELECT COUNT(*) FROM menu_items m WHERE m.hotel_id = h.id AND m.is_available = true) AS available_menu_items,
    h.max_menu_items_allowed,
    (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id AND DATE(o.created_at) = CURRENT_DATE) AS today_orders,
    (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id AND DATE(o.created_at) = CURRENT_DATE AND o.status = 'completed') AS today_completed_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.hotel_id = h.id AND DATE(o.created_at) = CURRENT_DATE) AS today_revenue,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.hotel_id = h.id AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS monthly_revenue,
    (SELECT COUNT(*) FROM orders o WHERE o.hotel_id = h.id AND o.status IN ('pending', 'confirmed', 'preparing')) AS pending_orders
FROM hotels h
WHERE h.is_active = true;

CREATE OR REPLACE VIEW active_orders_view AS
SELECT
    o.id,
    o.hotel_id,
    o.order_number,
    o.table_id,
    t.table_number,
    o.waiter_id,
    u.full_name AS waiter_name,
    o.customer_name,
    o.total_amount,
    o.status,
    o.payment_status,
    o.created_at,
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS minutes_ago,
    (
        SELECT COUNT(*)
        FROM order_items oi
        WHERE oi.order_id = o.id
          AND oi.status IN ('pending', 'preparing')
    ) AS pending_items
FROM orders o
LEFT JOIN hotel_tables t ON o.table_id = t.id
LEFT JOIN users u ON o.waiter_id = u.id
WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
ORDER BY
    CASE o.status
        WHEN 'pending' THEN 1
        WHEN 'confirmed' THEN 2
        WHEN 'preparing' THEN 3
        WHEN 'ready' THEN 4
    END,
    o.created_at DESC;

CREATE OR REPLACE VIEW menu_availability_view AS
SELECT
    mi.id,
    mi.hotel_id,
    mi.item_code,
    mi.name,
    mi.price,
    mc.name AS category_name,
    mi.is_available,
    mi.preparation_time,
    mi.is_popular,
    mi.is_vegetarian,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.menu_item_id = mi.id AND DATE(oi.created_at) = CURRENT_DATE) AS today_orders,
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.menu_item_id = mi.id AND DATE(oi.created_at) = CURRENT_DATE) AS today_quantity
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.is_available = true
ORDER BY mc.display_order, mi.name;

CREATE OR REPLACE VIEW low_stock_inventory_view AS
SELECT
    i.id,
    i.hotel_id,
    i.item_code,
    i.item_name,
    ic.name AS category_name,
    i.current_quantity,
    i.min_quantity,
    i.unit,
    i.unit_cost,
    i.total_value,
    i.status,
    i.supplier_name,
    i.last_purchased_date,
    COALESCE(EXTRACT(DAY FROM AGE(CURRENT_DATE, i.last_purchased_date)), 0) AS days_since_last_purchase,
    i.daily_consumption_avg,
    i.monthly_consumption_avg,
    CASE
        WHEN i.daily_consumption_avg > 0
        THEN ROUND(i.current_quantity / NULLIF(i.daily_consumption_avg, 0), 1)
        ELSE NULL
    END AS days_of_stock_remaining
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
  AND i.current_quantity <= i.min_quantity
ORDER BY i.current_quantity / NULLIF(i.min_quantity, 1) ASC, i.item_name;

CREATE OR REPLACE VIEW expiring_inventory_view AS
SELECT
    i.id,
    i.hotel_id,
    i.item_code,
    i.item_name,
    ic.name AS category_name,
    i.current_quantity,
    i.unit,
    i.expiry_date,
    i.unit_cost,
    i.total_value,
    EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) AS days_until_expiry,
    CASE
        WHEN EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) <= 7 THEN 'critical'
        WHEN EXTRACT(DAY FROM AGE(i.expiry_date, CURRENT_DATE)) <= 30 THEN 'warning'
        ELSE 'normal'
    END AS expiry_status
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
  AND i.expiry_date IS NOT NULL
  AND i.expiry_date >= CURRENT_DATE
  AND i.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY i.expiry_date ASC;

CREATE OR REPLACE VIEW inventory_valuation_view AS
SELECT
    i.hotel_id,
    ic.name AS category_name,
    COUNT(*) AS item_count,
    SUM(i.current_quantity) AS total_quantity,
    SUM(i.total_value) AS total_value,
    AVG(i.unit_cost) AS avg_unit_cost,
    SUM(CASE WHEN i.status = 'low_stock' THEN 1 ELSE 0 END) AS low_stock_count,
    SUM(CASE WHEN i.status = 'out_of_stock' THEN 1 ELSE 0 END) AS out_of_stock_count
FROM inventory i
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
GROUP BY i.hotel_id, ic.name, ic.display_order
ORDER BY ic.display_order, ic.name;

CREATE OR REPLACE VIEW monthly_consumption_report AS
SELECT
    i.hotel_id,
    DATE_TRUNC('month', it.transaction_date) AS month,
    ic.name AS category_name,
    i.item_name,
    SUM(ABS(it.quantity_change)) AS total_consumption,
    AVG(ABS(it.quantity_change)) AS avg_daily_consumption,
    SUM(it.total_price) AS total_cost,
    COUNT(*) AS transaction_count
FROM inventory_transactions it
JOIN inventory i ON it.inventory_id = i.id
LEFT JOIN inventory_categories ic ON i.category_id = ic.id
WHERE it.transaction_type IN ('consumption', 'sale', 'wastage')
GROUP BY i.hotel_id, DATE_TRUNC('month', it.transaction_date), ic.name, i.item_name
ORDER BY month DESC, total_consumption DESC;

CREATE OR REPLACE VIEW inventory_alerts_summary_view AS
SELECT
    ia.hotel_id,
    ia.alert_type,
    ia.alert_level,
    COUNT(*) AS alert_count,
    COUNT(CASE WHEN NOT ia.is_read THEN 1 END) AS unread_count,
    COUNT(CASE WHEN NOT ia.is_resolved THEN 1 END) AS unresolved_count,
    MIN(ia.created_at) AS oldest_alert,
    MAX(ia.created_at) AS latest_alert
FROM inventory_alerts ia
WHERE ia.expires_at > CURRENT_TIMESTAMP
GROUP BY ia.hotel_id, ia.alert_type, ia.alert_level
ORDER BY alert_level DESC, alert_count DESC;

CREATE OR REPLACE VIEW hotel_subscription_status AS
SELECT
    h.id,
    h.hotel_name,
    h.hotel_slug,
    h.subscription_plan_id,
    sp.plan_name,
    sp.plan_code,
    sp.price_per_year,
    h.billing_cycle,
    h.registration_type,
    h.payment_method,
    h.subscription_status,
    h.subscription_start_date,
    h.subscription_end_date,
    h.trial_starts_at,
    h.trial_ends_at,
    h.payment_status,
    h.is_active,
    h.is_verified,
    CASE
        WHEN h.registration_type = 'trial' AND h.trial_ends_at < CURRENT_DATE THEN 'trial_expired'
        WHEN h.registration_type = 'subscription' AND h.subscription_end_date < CURRENT_DATE THEN 'expired'
        WHEN h.registration_type = 'subscription' AND h.payment_status = 'pending' THEN 'payment_pending'
        ELSE h.subscription_status
    END AS effective_status,
    CASE
        WHEN h.registration_type = 'trial' THEN h.trial_ends_at
        ELSE h.subscription_end_date
    END AS expiry_date
FROM hotels h
LEFT JOIN subscription_plans sp ON h.subscription_plan_id = sp.id;

-- =========================================================
-- TRIGGERS
-- =========================================================

CREATE TRIGGER update_hotels_updated_at
BEFORE UPDATE ON hotels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON menu_categories
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

CREATE TRIGGER update_inventory_categories_updated_at
BEFORE UPDATE ON inventory_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_item_inventory_updated_at
BEFORE UPDATE ON menu_item_inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_terms_updated_at
BEFORE UPDATE ON terms_and_conditions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_registrations_updated_at
BEFORE UPDATE ON pending_registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER generate_user_staff_code_trigger
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION generate_user_staff_code();

CREATE TRIGGER generate_table_number_trigger
BEFORE INSERT ON hotel_tables
FOR EACH ROW EXECUTE FUNCTION generate_table_number();

CREATE TRIGGER generate_menu_item_code_trigger
BEFORE INSERT ON menu_items
FOR EACH ROW EXECUTE FUNCTION generate_menu_item_code();

CREATE TRIGGER generate_inventory_item_code_trigger
BEFORE INSERT ON inventory
FOR EACH ROW EXECUTE FUNCTION generate_inventory_item_code();

CREATE TRIGGER update_order_total_insert
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_update
AFTER UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_delete
AFTER DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_inventory_status_trigger
BEFORE INSERT OR UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

CREATE TRIGGER process_inventory_transaction_trigger
BEFORE INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION process_inventory_transaction();

CREATE TRIGGER update_consumption_averages_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW
WHEN (NEW.transaction_type IN ('consumption', 'sale', 'wastage'))
EXECUTE FUNCTION update_consumption_averages();

CREATE TRIGGER deduct_inventory_on_order_completion_trigger
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_order_completion();

-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO subscription_plans (
    id, plan_name, plan_code, price_per_year, max_staff, max_tables, max_menu_items, description, features, display_order
) VALUES
(
    uuid_generate_v4(),
    'Starter',
    'STARTER',
    299.99,
    3,
    10,
    50,
    'Perfect for small cafes and restaurants just getting started.',
    '{
        "online_ordering": true,
        "basic_reports": true,
        "email_support": true,
        "mobile_pos": true,
        "qr_code_ordering": true,
        "table_management": true
    }',
    1
),
(
    uuid_generate_v4(),
    'Business',
    'BUSINESS',
    599.99,
    10,
    30,
    200,
    'For growing restaurants and hotels with increasing demands.',
    '{
        "online_ordering": true,
        "advanced_reports": true,
        "phone_support": true,
        "table_reservations": true,
        "inventory_management": true,
        "staff_scheduling": true,
        "multiple_payment_gateways": true,
        "custom_branding": true
    }',
    2
),
(
    uuid_generate_v4(),
    'Enterprise',
    'ENTERPRISE',
    1199.99,
    30,
    100,
    500,
    'For large hotels and restaurant chains with multiple branches.',
    '{
        "online_ordering": true,
        "full_reports": true,
        "priority_support": true,
        "dedicated_manager": true,
        "multi_branch": true,
        "custom_integrations": true,
        "api_access": true,
        "white_label": true,
        "crm": true,
        "marketing_automation": true
    }',
    3
)
ON CONFLICT (plan_code) DO NOTHING;

INSERT INTO main_admins (id, email, password_hash, full_name) VALUES
(
    uuid_generate_v4(),
    'admin@hotelease.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4JQ6YtLqW2',
    'Platform Administrator'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO terms_and_conditions (title, content, version, type, applies_to, is_mandatory, created_by) VALUES
(
    'Platform Terms of Service',
    'Welcome to HotelEase. By accessing or using our platform, you agree to be bound by these terms...',
    '1.0.0',
    'platform',
    'all',
    true,
    (SELECT id FROM main_admins LIMIT 1)
),
(
    'Privacy Policy',
    'Your privacy is important to us. This policy describes how we collect, use, and protect your personal information...',
    '1.0.0',
    'privacy',
    'all',
    true,
    (SELECT id FROM main_admins LIMIT 1)
),
(
    'Cancellation and Refund Policy',
    'This policy outlines the terms for cancellation of subscriptions and refunds...',
    '1.0.0',
    'cancellation',
    'all',
    true,
    (SELECT id FROM main_admins LIMIT 1)
)
ON CONFLICT DO NOTHING;