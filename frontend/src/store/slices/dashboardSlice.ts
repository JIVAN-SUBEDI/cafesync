import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { hotelApi } from "@/services/hotelApi";
import { getApiError } from "@/services/apiService";

// ===================== HELPERS =====================
const unwrap = <T>(response: any): T => {
  return (response?.data?.data ?? response?.data) as T;
};

// ===================== TYPES =====================
export interface DashboardStats {
  today_revenue: number;
  today_orders: number;
  active_orders: number;
  table_occupancy: number;
  staff_active: string;
  pending_kitchen_orders: number;
  low_inventory_items: number;
  menu_items: string;
}

export interface HotelInfo {
  id: string;
  hotel_name: string;
  hotel_slug: string;
  admin_name?: string;
  admin_email?: string;
  hotel_phone?: string;
  hotel_address?: string;
  city?: string;
  country?: string;
  is_active?: boolean;
  is_verified?: boolean;
  subscription_status?: any;
  subscription_plan_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateHotelProfilePayload {
  hotelId: string;
  hotel_name: string;
  hotel_phone?: string;
  hotel_address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  service_charge?: number;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  table_number: string;
  customer_name: string;
  customer_phone?: string;
  amount: number;
  subtotal?: number;
  tax_amount?: number;
  service_charge?: number;
  discount_amount?: number;
  total_amount?: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";
  items: number;
  order_items?: OrderItem[];
  time: string;
  waiter_id?: string;
  waiter_name?: string;
  created_at: string;
  payment_status?:
    | "pending"
    | "partial"
    | "paid"
    | "refunded"
    | "partially_paid";
  payment_method?: string;
  paid_amount?: number;
  special_instructions?: string;
  kitchen_notes?: string;
}

export interface CreateOrderPayload {
  table_id?: string;
  waiter_id?: string;
  customer_name?: string;
  customer_phone?: string;
  special_instructions?: string;
  kitchen_notes?: string;
  discount_amount?: number;
  tax_amount?: number;
  service_charge?: number;
  payment_method?: string;
  paid_amount?: number;
  subtotal?: number;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    unit_price?: number;
    special_instructions?: string;
  }>;
}

export interface Staff {
  id: string;
  staff_code: string;
  full_name: string;
  role: "hotel_admin" | "waiter" | "kitchen" | "billing";
  phone?: string;
  profile_image?: string;
  image?: string;
  email?: string;
  status: "active" | "inactive";
  is_active: boolean;
  password?: string;
  permissions?: any;
  total_orders?: number;
  today_orders: number;
  today_sales?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  item_code: string;
  name: string;
  description?: string;
  category: string;
  category_id: string;
  price: number;
  cost_price?: number | null;
  tax_rate: number;
  preparation_time?: number | null;
  popularity: number;
  is_available: boolean;
  is_popular: boolean;
  is_vegetarian?: boolean;
  dietary_info?: string | null;
  image_url?: string | null;
  today_orders: number;
  weekly_orders: number;
  created_at: string;
  updated_at?: string;
}

export interface Table {
  id: string;
  table_number: string;
  table_name?: string;
  capacity: number;
  floor_number?: number;
  section?: string;
  status: "available" | "occupied" | "reserved" | "cleaning";
  waiter_id?: string;
  waiter_name?: string;
  order_amount?: number;
  qr_code_url?: string;
  today_orders?: number;
  today_sales?: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  items: number;
  available_items: number;
  is_active: boolean;
  display_order: number;
  image_url?: string;
  avg_price: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  item_code: string;
  name: string;
  item_name?: string;
  description?: string;
  category: string;
  category_id?: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  status:
    | "in_stock"
    | "low_stock"
    | "out_of_stock"
    | "over_stock"
    | "discontinued";
  supplier_name?: string;
  supplier_contact?: string;
  last_purchased_date?: string;
  daily_consumption: number;
  monthly_consumption?: number;
  days_of_stock?: number;
  expiry_date?: string;
  location?: string;
  barcode?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type:
    | "purchase"
    | "sale"
    | "adjustment"
    | "wastage"
    | "transfer"
    | "production"
    | "consumption";
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  unit_price?: number;
  total_price?: number;
  reference_number?: string;
  order_id?: string;
  supplier_id?: string;
  staff_id?: string;
  notes?: string;
  reason?: string;
  created_by: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  alert_type: string;
  alert_level: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  expires_at: string;
  resolved_at?: string;
  inventory: {
    id: string;
    item_code: string;
    item_name: string;
  };
  resolved_by?: string;
}

export interface KitchenOrder {
  id: string;
  order_id: string;
  order_number: string;
  table_id: string;
  table_number: string;
  items: any[];
  status: "pending" | "preparing" | "ready" | "served";
  time: string;
  chef_id?: string;
  chef_name?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  prepared_by?: string;
  prepared_at?: string;
  served_by?: string;
  served_at?: string;
  created_at: string;
}

export interface SidebarCounts {
  staff: number;
  category: number;
  menu: number;
  tables: number;
  orders: number;
  kitchen: number;
  inventory: number;
}

export interface DashboardData {
  hotel: HotelInfo | null;
  stats: DashboardStats;
  recent_orders: Order[];
  staff: Staff[];
  tables: Table[];
  categories: Category[];
  menu_items: MenuItem[];
  inventory: InventoryItem[];
  kitchen_orders: KitchenOrder[];
  sidebar_counts: SidebarCounts;
  hotel_name?: string;
  hotel_slug?: string;
  last_updated: string;
}

export interface PaymentMethod {
  id: string;
  hotel_id: string;
  method_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddPaymentMethodPayload {
  hotelId: string;
  method_name: string;
}

export interface UpdatePaymentMethodPayload {
  id: string;
  method_name?: string;
  is_enabled?: boolean;
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  staffList: Staff[];
  menuItemsList: MenuItem[];
  tablesList: Table[];
  categoriesList: Category[];
  inventoryList: InventoryItem[];
  inventoryCategories: InventoryCategory[];
  inventoryTransactions: InventoryTransaction[];
  inventoryAlerts: InventoryAlert[];
  inventoryValuation: {
    summary: {
      total_items: number;
      total_value: number;
      total_quantity: number;
      avg_unit_cost: number;
    };
    categories: Array<{
      category_id: string;
      category_name: string;
      item_count: number;
      category_value: number;
    }>;
  } | null;
  ordersList: Order[];
  kitchenOrdersList: KitchenOrder[];
  paymentMethods: PaymentMethod[];
  paymentMethodsLoading: boolean;
  paymentMethodsError: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  lastFetched: null,
  staffList: [],
  menuItemsList: [],
  tablesList: [],
  categoriesList: [],
  inventoryList: [],
  inventoryCategories: [],
  inventoryTransactions: [],
  inventoryAlerts: [],
  inventoryValuation: null,
  ordersList: [],
  kitchenOrdersList: [],
  paymentMethods: [],
  paymentMethodsLoading: false,
  paymentMethodsError: null,
};

// ===================== NORMALIZERS =====================

const normalizeMenuItem = (raw: any): MenuItem => {
  const weeklyOrders = Number(raw?.weekly_orders ?? 0);
  return {
    id: raw.id,
    item_code: raw.item_code,
    name: raw.name,
    description: raw.description ?? "",
    category_id: raw.category_id,
    category: raw.category_name ?? raw.category ?? "",
    price: Number(raw.price ?? 0),
    cost_price:
      raw.cost_price !== null && raw.cost_price !== undefined
        ? Number(raw.cost_price)
        : null,
    tax_rate: Number(raw.tax_rate ?? 0),
    preparation_time: raw.preparation_time ?? null,
    is_available: !!raw.is_available,
    is_popular: !!raw.is_popular,
    is_vegetarian: !!raw.is_vegetarian,
    dietary_info: raw.dietary_info ?? null,
    image_url: raw.image_url ?? null,
    today_orders: Number(raw.today_orders ?? 0),
    weekly_orders: weeklyOrders,
    popularity: Number(
      raw.popularity ?? Math.min(100, Math.round((weeklyOrders / 50) * 100)),
    ),
    created_at: raw.created_at,
    updated_at: raw.updated_at ?? raw.created_at,
  };
};

const normalizeInventoryItem = (raw: any): InventoryItem => {
  return {
    id: raw.id,
    item_code: raw.item_code,
    name: raw.item_name || raw.name,
    item_name: raw.item_name || raw.name,
    description: raw.description,
    category: raw.category_name || raw.category || "Uncategorized",
    category_id: raw.category_id,
    current_quantity: Number(raw.current_quantity ?? 0),
    min_quantity: Number(raw.min_quantity ?? 0),
    max_quantity: raw.max_quantity ? Number(raw.max_quantity) : undefined,
    unit: raw.unit,
    unit_cost: Number(raw.unit_cost ?? 0),
    total_value: Number(raw.total_value ?? 0),
    status:
      raw.status ||
      (raw.current_quantity <= raw.min_quantity ? "low_stock" : "in_stock"),
    supplier_name: raw.supplier_name,
    supplier_contact: raw.supplier_contact,
    last_purchased_date: raw.last_purchased_date,
    daily_consumption: Number(
      raw.daily_consumption ?? raw.daily_consumption_avg ?? 0,
    ),
    monthly_consumption: Number(raw.monthly_consumption_avg ?? 0),
    days_of_stock: raw.days_of_stock_remaining
      ? Number(raw.days_of_stock_remaining)
      : undefined,
    expiry_date: raw.expiry_date,
    location: raw.location,
    barcode: raw.barcode,
    is_active: raw.is_active ?? true,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

const normalizeStaff = (raw: any, oldStaff?: Partial<Staff>): Staff => {
  const fullName = raw?.full_name || oldStaff?.full_name || "";

  return {
    id: raw?.id ?? oldStaff?.id ?? "",
    staff_code: raw?.staff_code ?? oldStaff?.staff_code ?? "",
    full_name: fullName,
    role: raw?.role ?? oldStaff?.role ?? "waiter",
    phone: raw?.phone_number ?? raw?.phone ?? oldStaff?.phone,
    email: raw?.email ?? oldStaff?.email,
    status:
      raw?.status ??
      (raw?.is_active !== undefined
        ? raw.is_active
          ? "active"
          : "inactive"
        : (oldStaff?.status ?? "inactive")),
    is_active:
      raw?.is_active !== undefined
        ? !!raw.is_active
        : (oldStaff?.is_active ?? false),
    today_orders: raw?.today_orders ?? oldStaff?.today_orders ?? 0,
    today_sales: raw?.today_sales ?? oldStaff?.today_sales,
    total_orders: raw?.total_orders ?? oldStaff?.total_orders,
    permissions: raw?.permissions ?? oldStaff?.permissions,
    profile_image: raw?.profile_image ?? oldStaff?.profile_image,
    image: raw?.image ?? oldStaff?.image,
    created_at: raw?.created_at ?? oldStaff?.created_at,
    updated_at: raw?.updated_at ?? oldStaff?.updated_at,
  };
};
// ===================== HELPER FUNCTIONS =====================
const handleApiError = (err: any, defaultMessage: string): string => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return defaultMessage;
};

// ===================== ASYNC THUNKS =====================

export const fetchDashboardData = createAsyncThunk<
  DashboardData,
  void,
  { rejectValue: string }
>("dashboard/fetchDashboardData", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/dashboard`);
    const data = unwrap<DashboardData>(response);
    return data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch dashboard data"),
    );
  }
});

// ===================== STAFF THUNKS =====================

export const fetchStaff = createAsyncThunk<
  Staff[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchStaff", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/staff`);
    const root = response?.data;
    return Array.isArray(root?.staff)
      ? root.staff.map((staff: any) => normalizeStaff(staff))
      : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch staff"),
    );
  }
});

export const createStaff = createAsyncThunk<
  Staff,
  { hotelSlug?: string; staffData: any },
  { rejectValue: string }
>("dashboard/createStaff", async ({ staffData }, thunkAPI) => {
  try {
    const formData = new FormData();
    formData.append("full_name", staffData.full_name ?? staffData.name ?? "");
    formData.append("role", staffData.role ?? "");
    formData.append(
      "phone_number",
      staffData.phone ?? staffData.phone_number ?? "",
    );
    formData.append("email", staffData.email ?? "");
    formData.append("password", staffData.password ?? "");
    if (staffData.image instanceof File) {
      formData.append("profile_img", staffData.image);
    }

    const response = await hotelApi.post(`/api/hotel/data/staff`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const created = response?.data?.staff;
    return normalizeStaff(created);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to create staff"),
    );
  }
});

export const updateStaff = createAsyncThunk<
  Staff,
  { hotelSlug?: string; staffId: string; staffData: any },
  { rejectValue: string }
>("dashboard/updateStaff", async ({ staffId, staffData }, thunkAPI) => {
  try {
    const formData = new FormData();
    if (staffData.full_name ?? staffData.name)
      formData.append("full_name", staffData.full_name ?? staffData.name);
    if (staffData.role) formData.append("role", staffData.role);
    if (staffData.phone ?? staffData.phone_number)
      formData.append(
        "phone_number",
        staffData.phone ?? staffData.phone_number,
      );
    if (staffData.email) formData.append("email", staffData.email);
    if (staffData.password && staffData.password.trim())
      formData.append("password", staffData.password);
    if (staffData.permissions)
      formData.append("permissions", JSON.stringify(staffData.permissions));
    if (staffData.is_active !== undefined)
      formData.append("is_active", String(staffData.is_active));
    if (staffData.image instanceof File)
      formData.append("profile_img", staffData.image);

    const response = await hotelApi.put(
      `/api/hotel/data/staff/${staffId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    const updated = response?.data?.staff;
    return normalizeStaff(updated);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to update staff"),
    );
  }
});

export const deleteStaff = createAsyncThunk<
  string,
  { hotelSlug?: string; staffId: string },
  { rejectValue: string }
>("dashboard/deleteStaff", async ({ staffId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/staff/${staffId}`);
    return staffId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete staff"),
    );
  }
});

export const toggleStaffStatus = createAsyncThunk<
  Staff,
  { hotelSlug?: string; staffId: string },
  { rejectValue: string }
>("dashboard/toggleStaffStatus", async ({ staffId }, thunkAPI) => {
  try {
    const state = thunkAPI.getState() as { dashboard: DashboardState };

    const oldStaff = state.dashboard.staffList.find(
      (staff) => staff.id === staffId,
    );

    const response = await hotelApi.patch(
      `/api/hotel/data/staff/${staffId}/change`,
    );

    return normalizeStaff(response?.data?.staff, oldStaff);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to toggle staff status"),
    );
  }
});

// ===================== CATEGORY THUNKS =====================

export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>("dashboard/fetchCategories", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/menu/categories`);
    const root = response?.data;
    return Array.isArray(root?.categories)
      ? root.categories
      : Array.isArray(root?.data)
        ? root.data
        : Array.isArray(root)
          ? root
          : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch categories"),
    );
  }
});

export const createCategory = createAsyncThunk<
  Category,
  { hotelSlug?: string; categoryData: any },
  { rejectValue: string }
>("dashboard/createCategory", async ({ categoryData }, thunkAPI) => {
  try {
    let dataToSend = categoryData;
    let headers = {};
    if (categoryData instanceof FormData) {
      dataToSend = categoryData;
      headers = { "Content-Type": "multipart/form-data" };
    }
    const response = await hotelApi.post(
      `/api/hotel/data/menu/categories`,
      dataToSend,
      { headers },
    );
    const root = response?.data;
    return (root?.category ?? root?.data) as Category;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data || handleApiError(err, "Failed to create category"),
    );
  }
});

export const updateCategory = createAsyncThunk<
  Category,
  { hotelSlug?: string; categoryId: string; categoryData: any },
  { rejectValue: string }
>(
  "dashboard/updateCategory",
  async ({ categoryId, categoryData }, thunkAPI) => {
    try {
      let dataToSend = categoryData;
      let headers = {};
      if (categoryData instanceof FormData) {
        dataToSend = categoryData;
        headers = { "Content-Type": "multipart/form-data" };
      }
      const response = await hotelApi.put(
        `/api/hotel/data/menu/categories/${categoryId}`,
        dataToSend,
        { headers },
      );
      const root = response?.data;
      return (root?.category ?? root?.data) as Category;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data || handleApiError(err, "Failed to update category"),
      );
    }
  },
);

export const deleteCategory = createAsyncThunk<
  string,
  { hotelSlug?: string; categoryId: string },
  { rejectValue: string }
>("dashboard/deleteCategory", async ({ categoryId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/menu/categories/${categoryId}`);
    return categoryId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete category"),
    );
  }
});

// ===================== MENU ITEM THUNKS =====================

export const fetchMenuItems = createAsyncThunk<
  MenuItem[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchMenuItems", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/menu/items`);
    const root = response?.data;
    const arr = Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.data)
        ? root.data
        : Array.isArray(root)
          ? root
          : [];
    return arr.map(normalizeMenuItem);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch menu items"),
    );
  }
});

export const createMenuItem = createAsyncThunk<
  MenuItem,
  { hotelSlug?: string; menuItemData: any },
  { rejectValue: string }
>("dashboard/createMenuItem", async ({ menuItemData }, thunkAPI) => {
  try {
    let dataToSend = menuItemData;
    let headers = {};
    if (menuItemData instanceof FormData) {
      dataToSend = menuItemData;
      headers = { "Content-Type": "multipart/form-data" };
    }

    const response = await hotelApi.post(
      `/api/hotel/data/menu/items`,
      dataToSend,
      { headers },
    );
    const created = response?.data?.item;
    const state: any = thunkAPI.getState();
    const categories = state?.dashboard?.categoriesList || [];

    const categoryId =
      menuItemData instanceof FormData
        ? menuItemData.get("category_id")
        : menuItemData.category_id;
    const taxRate =
      menuItemData instanceof FormData
        ? menuItemData.get("tax_rate")
        : menuItemData.tax_rate;
    const isPopular =
      menuItemData instanceof FormData
        ? menuItemData.get("is_popular") === "true"
        : menuItemData.is_popular;
    const isVegetarian =
      menuItemData instanceof FormData
        ? menuItemData.get("is_vegetarian") === "true"
        : menuItemData.is_vegetarian;
    const dietaryInfo =
      menuItemData instanceof FormData
        ? menuItemData.get("dietary_info")
        : menuItemData.dietary_info;
    const catName =
      categories.find((c: any) => c.id === categoryId)?.name ?? "";

    return normalizeMenuItem({
      ...created,
      category_id: categoryId,
      category_name: catName,
      tax_rate: taxRate,
      is_popular: isPopular,
      is_vegetarian: isVegetarian,
      dietary_info: dietaryInfo,
      image_url: created?.image_url,
      weekly_orders: 0,
      today_orders: 0,
      updated_at: created?.created_at,
    });
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data || handleApiError(err, "Failed to create menu item"),
    );
  }
});

export const updateMenuItem = createAsyncThunk<
  MenuItem,
  { hotelSlug?: string; menuItemId: string; menuItemData: any },
  { rejectValue: string }
>(
  "dashboard/updateMenuItem",
  async ({ menuItemId, menuItemData }, thunkAPI) => {
    try {
      let dataToSend = menuItemData;
      let headers = {};
      if (menuItemData instanceof FormData) {
        dataToSend = menuItemData;
        headers = { "Content-Type": "multipart/form-data" };
      }

      const response = await hotelApi.put(
        `/api/hotel/data/menu/items/${menuItemId}`,
        dataToSend,
        { headers },
      );
      const updated = response?.data?.item;
      const state: any = thunkAPI.getState();
      const categories = state?.dashboard?.categoriesList || [];
      const catId = updated?.category_id;
      const catName = categories.find((c: any) => c.id === catId)?.name ?? "";
      return normalizeMenuItem({
        ...updated,
        category_id: catId,
        category_name: catName,
        updated_at: updated?.updated_at ?? new Date().toISOString(),
      });
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data || handleApiError(err, "Failed to update menu item"),
      );
    }
  },
);

export const deleteMenuItem = createAsyncThunk<
  string,
  { hotelSlug?: string; menuItemId: string },
  { rejectValue: string }
>("dashboard/deleteMenuItem", async ({ menuItemId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/menu/items/${menuItemId}`);
    return menuItemId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete menu item"),
    );
  }
});

// ===================== TABLE THUNKS =====================

export const fetchTables = createAsyncThunk<
  Table[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchTables", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/tables`, {
      withCredentials: true,
    });
    const root = response?.data;
    return Array.isArray(root?.tables)
      ? root.tables
      : Array.isArray(root?.data)
        ? root.data
        : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch tables"),
    );
  }
});

export const createTable = createAsyncThunk<
  Table,
  { tableData: Partial<Table> },
  { rejectValue: string }
>("dashboard/createTable", async ({ tableData }, thunkAPI) => {
  try {
    const response = await hotelApi.post(`/api/hotel/data/tables`, tableData);
    const root = response?.data;
    return (root?.table ?? root?.data) as Table;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to create table"),
    );
  }
});

export const updateTable = createAsyncThunk<
  Table,
  { tableId: string; tableData: Partial<Table> },
  { rejectValue: string }
>("dashboard/updateTable", async ({ tableId, tableData }, thunkAPI) => {
  try {
    const response = await hotelApi.put(
      `/api/hotel/data/tables/${tableId}`,
      tableData,
    );
    const root = response?.data;
    return (root?.table ?? root?.data) as Table;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to update table"),
    );
  }
});

export const updateTableStatus = createAsyncThunk<
  Table,
  { tableId: string; status: Table["status"] },
  { rejectValue: string }
>("dashboard/updateTableStatus", async ({ tableId, status }, thunkAPI) => {
  try {
    const response = await hotelApi.put(
      `/api/hotel/data/tables/${tableId}/status`,
      { status },
    );
    const root = response?.data;
    return (root?.table ?? root?.data) as Table;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to update table status"),
    );
  }
});

export const deleteTable = createAsyncThunk<
  string,
  { tableId: string },
  { rejectValue: string }
>("dashboard/deleteTable", async ({ tableId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/tables/${tableId}`);
    return tableId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete table"),
    );
  }
});

// ===================== INVENTORY THUNKS =====================

export const fetchInventory = createAsyncThunk<
  InventoryItem[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchInventory", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/inventory`);
    const root = response?.data;
    const inventoryArr = Array.isArray(root?.inventory)
      ? root.inventory
      : Array.isArray(root?.data)
        ? root.data
        : [];
    return inventoryArr.map(normalizeInventoryItem);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch inventory"),
    );
  }
});

export const fetchInventoryCategories = createAsyncThunk<
  InventoryCategory[],
  void,
  { rejectValue: string }
>("dashboard/fetchInventoryCategories", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/inventory/categories`);
    const root = response?.data;
    return Array.isArray(root?.categories) ? root.categories : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch inventory categories"),
    );
  }
});

export const fetchLowStockInventory = createAsyncThunk<
  InventoryItem[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchLowStockInventory", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/inventory/low-stock`);
    const root = response?.data;
    const inventoryArr = Array.isArray(root?.inventory)
      ? root.inventory
      : Array.isArray(root?.data)
        ? root.data
        : [];
    return inventoryArr.map(normalizeInventoryItem);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch low stock inventory"),
    );
  }
});

export const fetchExpiringSoonInventory = createAsyncThunk<
  InventoryItem[],
  { days?: number; limit?: number },
  { rejectValue: string }
>(
  "dashboard/fetchExpiringSoonInventory",
  async ({ days = 30, limit = 20 }, thunkAPI) => {
    try {
      const response = await hotelApi.get(
        `/api/hotel/data/inventory/expiring-soon?days=${days}&limit=${limit}`,
      );
      const root = response?.data;
      const itemsArr = Array.isArray(root?.items) ? root.items : [];
      return itemsArr.map((item: any) =>
        normalizeInventoryItem({ ...item, item_name: item.name }),
      );
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to fetch expiring soon inventory"),
      );
    }
  },
);

export const fetchInventoryValuation = createAsyncThunk<
  any,
  string | void,
  { rejectValue: string }
>("dashboard/fetchInventoryValuation", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/inventory/valuation`);
    const root = response?.data;
    return {
      summary: root?.summary || {
        total_items: 0,
        total_value: 0,
        total_quantity: 0,
        avg_unit_cost: 0,
      },
      categories: root?.categories || [],
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch inventory valuation"),
    );
  }
});

export const fetchInventoryAlerts = createAsyncThunk<
  InventoryAlert[],
  { unread?: boolean; unresolved?: boolean; page?: number; limit?: number },
  { rejectValue: string }
>(
  "dashboard/fetchInventoryAlerts",
  async ({ unread, unresolved, page = 1, limit = 20 }, thunkAPI) => {
    try {
      let url = `/api/hotel/data/inventory/alerts?page=${page}&limit=${limit}`;
      if (unread) url += `&unread=true`;
      if (unresolved) url += `&unresolved=true`;
      const response = await hotelApi.get(url);
      const root = response?.data;
      return (root?.alerts || []) as InventoryAlert[];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to fetch inventory alerts"),
      );
    }
  },
);

export const fetchInventoryTransactions = createAsyncThunk<
  InventoryTransaction[],
  string,
  { rejectValue: string }
>("dashboard/fetchInventoryTransactions", async (inventoryId, thunkAPI) => {
  try {
    const response = await hotelApi.get(
      `/api/hotel/data/inventory/transactions/${inventoryId}`,
    );
    const root = response?.data;
    return Array.isArray(root?.transactions) ? root.transactions : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch inventory transactions"),
    );
  }
});

export const createInventoryItem = createAsyncThunk<
  InventoryItem,
  { hotelSlug?: string; inventoryData: Partial<InventoryItem> },
  { rejectValue: string }
>("dashboard/createInventoryItem", async ({ inventoryData }, thunkAPI) => {
  try {
    const payload = {
      item_name: inventoryData.name || inventoryData.item_name,
      category_id: inventoryData.category_id,
      description: inventoryData.description,
      current_quantity: inventoryData.current_quantity ?? 0,
      min_quantity: inventoryData.min_quantity ?? 10,
      max_quantity: inventoryData.max_quantity,
      unit: inventoryData.unit,
      unit_cost: inventoryData.unit_cost ?? 0,
      supplier_name: inventoryData.supplier_name,
      supplier_contact: inventoryData.supplier_contact,
      last_purchased_date: inventoryData.last_purchased_date,
      reorder_point: inventoryData.min_quantity,
      location: inventoryData.location,
      barcode: inventoryData.barcode,
      expiry_date: inventoryData.expiry_date,
    };
    const response = await hotelApi.post(`/api/hotel/data/inventory`, payload);
    const created = response?.data?.item;
    return normalizeInventoryItem(created);
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to create inventory item"),
    );
  }
});

export const updateInventoryItem = createAsyncThunk<
  InventoryItem,
  {
    hotelSlug?: string;
    inventoryId: string;
    inventoryData: Partial<InventoryItem>;
  },
  { rejectValue: string }
>(
  "dashboard/updateInventoryItem",
  async ({ inventoryId, inventoryData }, thunkAPI) => {
    try {
      const payload: any = {};
      if (inventoryData.name !== undefined)
        payload.item_name = inventoryData.name;
      if (inventoryData.item_name !== undefined)
        payload.item_name = inventoryData.item_name;
      if (inventoryData.category_id !== undefined)
        payload.category_id = inventoryData.category_id;
      if (inventoryData.description !== undefined)
        payload.description = inventoryData.description;
      if (inventoryData.min_quantity !== undefined)
        payload.min_quantity = inventoryData.min_quantity;
      if (inventoryData.max_quantity !== undefined)
        payload.max_quantity = inventoryData.max_quantity;
      if (inventoryData.unit !== undefined) payload.unit = inventoryData.unit;
      if (inventoryData.unit_cost !== undefined)
        payload.unit_cost = inventoryData.unit_cost;
      if (inventoryData.supplier_name !== undefined)
        payload.supplier_name = inventoryData.supplier_name;
      if (inventoryData.supplier_contact !== undefined)
        payload.supplier_contact = inventoryData.supplier_contact;
      if (inventoryData.last_purchased_date !== undefined)
        payload.last_purchased_date = inventoryData.last_purchased_date;
      if (inventoryData.location !== undefined)
        payload.location = inventoryData.location;
      if (inventoryData.barcode !== undefined)
        payload.barcode = inventoryData.barcode;
      if (inventoryData.expiry_date !== undefined)
        payload.expiry_date = inventoryData.expiry_date;
      if (inventoryData.is_active !== undefined)
        payload.is_active = inventoryData.is_active;
      if (inventoryData.status !== undefined)
        payload.status = inventoryData.status;

      const response = await hotelApi.put(
        `/api/hotel/data/inventory/${inventoryId}`,
        payload,
      );
      const updated = response?.data?.item;
      return normalizeInventoryItem(updated);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to update inventory item"),
      );
    }
  },
);

export const deleteInventoryItem = createAsyncThunk<
  string,
  { hotelSlug?: string; inventoryId: string },
  { rejectValue: string }
>("dashboard/deleteInventoryItem", async ({ inventoryId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/inventory/${inventoryId}`);
    return inventoryId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete inventory item"),
    );
  }
});

export const createInventoryTransaction = createAsyncThunk<
  InventoryTransaction,
  { hotelSlug?: string; transactionData: any },
  { rejectValue: string }
>(
  "dashboard/createInventoryTransaction",
  async ({ transactionData }, thunkAPI) => {
    try {
      const response = await hotelApi.post(
        `/api/hotel/data/inventory/transactions`,
        transactionData,
      );
      const root = response?.data;
      return (root?.transaction ?? root?.data) as InventoryTransaction;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to create inventory transaction"),
      );
    }
  },
);

export const markInventoryAlertRead = createAsyncThunk<
  string,
  { alertId: string },
  { rejectValue: string }
>("dashboard/markInventoryAlertRead", async ({ alertId }, thunkAPI) => {
  try {
    await hotelApi.put(`/api/hotel/data/inventory/alerts/${alertId}/read`);
    return alertId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to mark alert as read"),
    );
  }
});

export const resolveInventoryAlert = createAsyncThunk<
  string,
  { alertId: string },
  { rejectValue: string }
>("dashboard/resolveInventoryAlert", async ({ alertId }, thunkAPI) => {
  try {
    await hotelApi.put(`/api/hotel/data/inventory/alerts/${alertId}/resolve`);
    return alertId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to resolve alert"),
    );
  }
});

// ===================== ORDER THUNKS =====================

export const fetchOrders = createAsyncThunk<
  Order[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchOrders", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/orders`);
    const root = response?.data;
    return Array.isArray(root?.orders)
      ? root.orders
      : Array.isArray(root?.data)
        ? root.data
        : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch orders"),
    );
  }
});

export const fetchOrderById = createAsyncThunk<
  Order,
  { hotelSlug?: string; orderId: string },
  { rejectValue: string }
>("dashboard/fetchOrderById", async ({ orderId }, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/orders/${orderId}`);
    const root = response?.data;
    return (root?.order ?? root?.data) as Order;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch order"),
    );
  }
});

export const createOrder = createAsyncThunk<
  Order,
  { hotelSlug?: string; orderData: CreateOrderPayload },
  { rejectValue: string }
>("dashboard/createOrder", async ({ orderData }, thunkAPI) => {
  try {
    const response = await hotelApi.post(`/api/hotel/data/orders`, orderData);
    const root = response?.data;
    return (root?.order ?? root?.data) as Order;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data || handleApiError(err, "Failed to create order"),
    );
  }
});

export const updateOrder = createAsyncThunk<
  Order,
  { hotelSlug?: string; orderId: string; orderData: any },
  { rejectValue: any }
>("dashboard/updateOrder", async ({ orderId, orderData }, thunkAPI) => {
  try {
    const response = await hotelApi.put(
      `/api/hotel/data/orders/${orderId}`,
      orderData,
    );
    const root = response?.data;
    return (root?.order ?? root?.data) as Order;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data || handleApiError(err, "Failed to update order"),
    );
  }
});

export const updateOrderStatus = createAsyncThunk<
  Order,
  { hotelSlug?: string; orderId: string; status: Order["status"] },
  { rejectValue: any }
>("dashboard/updateOrderStatus", async ({ orderId, status }, thunkAPI) => {
  try {
    const response = await hotelApi.put(
      `/api/hotel/data/orders/${orderId}/status`,
      { status },
    );
    const root = response?.data;
    return (root?.order ?? root?.data) as Order;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data ||
        handleApiError(err, "Failed to update order status"),
    );
  }
});

export const updatePaymentStatus = createAsyncThunk<
  Order,
  {
    hotelSlug?: string;
    orderId: string;
    paymentData: {
      amount: number;
      payment_method: string;
      payment_status?: "success" | "pending" | "failed" | "refunded";
      transaction_ref?: string;
      notes?: string;
    };
  },
  { rejectValue: any }
>(
  "dashboard/updatePaymentStatus",
  async ({ orderId, paymentData }, thunkAPI) => {
    try {
      const response = await hotelApi.post(
        `/api/hotel/data/orders/${orderId}/payment`,
        paymentData,
      );
      const root = response?.data;
      return (root?.order ?? root?.data) as Order;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data ||
          handleApiError(err, "Failed to update payment status"),
      );
    }
  },
);

export const deleteOrder = createAsyncThunk<
  string,
  { hotelSlug?: string; orderId: string },
  { rejectValue: string }
>("dashboard/deleteOrder", async ({ orderId }, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/orders/${orderId}`);
    return orderId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete order"),
    );
  }
});

// ===================== KITCHEN ORDER THUNKS =====================

export const fetchKitchenOrders = createAsyncThunk<
  KitchenOrder[],
  string | void,
  { rejectValue: string }
>("dashboard/fetchKitchenOrders", async (_, thunkAPI) => {
  try {
    const response = await hotelApi.get(`/api/hotel/data/orders?type=kitchen`);
    const root = response?.data;
    return Array.isArray(root?.orders)
      ? root.orders
      : Array.isArray(root?.data)
        ? root.data
        : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch kitchen orders"),
    );
  }
});

export const updateKitchenItemStatus = createAsyncThunk<
  OrderItem,
  { orderId: string; status: OrderItem["status"] },
  { rejectValue: string }
>(
  "dashboard/updateKitchenItemStatus",
  async ({ orderId, status }, thunkAPI) => {
    console.log(orderId);
    try {
      const response = await hotelApi.put(
        `/api/hotel/data/orders/${orderId}/status`,
        { status },
      );
      const root = response?.data;
      return (root?.item ?? root?.data) as OrderItem;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to update kitchen item status"),
      );
    }
  },
);

// ===================== PROFILE THUNK =====================

export const updateHotelProfile = createAsyncThunk<
  HotelInfo,
  UpdateHotelProfilePayload,
  { rejectValue: string }
>(
  "dashboard/updateHotelProfile",
  async ({ hotelId, ...profileData }, thunkAPI) => {
    try {
      const response = await hotelApi.put(
        `/api/hotel/data/me/profile`,
        profileData,
      );
      const hotel =
        response?.data?.hotel ??
        response?.data?.data?.hotel ??
        response?.data?.data ??
        response?.data;
      return hotel as HotelInfo;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to update profile"),
      );
    }
  },
);

// ===================== PAYMENT METHOD THUNKS =====================

export const fetchPaymentMethods = createAsyncThunk<
  PaymentMethod[],
  string,
  { rejectValue: string }
>("dashboard/fetchPaymentMethods", async (hotelSlug, thunkAPI) => {
  try {
    const response = await hotelApi.get(
      `/api/hotel/hotels/${hotelSlug}/payment-methods`,
    );

    const root = response?.data;

    return Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.payment_methods)
        ? root.payment_methods
        : Array.isArray(root)
          ? root
          : [];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to fetch payment methods"),
    );
  }
});

export const addPaymentMethod = createAsyncThunk<
  PaymentMethod,
  AddPaymentMethodPayload,
  { rejectValue: string }
>("dashboard/addPaymentMethod", async ({ hotelId, method_name }, thunkAPI) => {
  try {
    const response = await hotelApi.post(
      `/api/hotel/hotels/${hotelId}/payment-methods`,
      {
        method_name,
        is_enabled: true,
      },
    );

    const root = response?.data;

    return (root?.data ?? root?.payment_method ?? root) as PaymentMethod;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to add payment method"),
    );
  }
});

export const updatePaymentMethod = createAsyncThunk<
  PaymentMethod,
  UpdatePaymentMethodPayload,
  { rejectValue: string }
>(
  "dashboard/updatePaymentMethod",
  async ({ id, method_name, is_enabled }, thunkAPI) => {
    try {
      const response = await hotelApi.put(
        `/api/hotel/payment-methods/${id}`,
        {
          method_name,
          is_enabled,
        },
      );

      const root = response?.data;

      return (root?.data ?? root?.payment_method ?? root) as PaymentMethod;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        handleApiError(err, "Failed to update payment method"),
      );
    }
  },
);

export const deletePaymentMethod = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("dashboard/deletePaymentMethod", async (id, thunkAPI) => {
  try {
    await hotelApi.delete(`/api/hotel/data/payment-methods/${id}`);
    return id;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      handleApiError(err, "Failed to delete payment method"),
    );
  }
});

// ===================== SLICE =====================

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    updateOrderStatusLocal: (
      state,
      action: PayloadAction<{ orderId: string; status: Order["status"] }>,
    ) => {
      const updateFn = (order: Order) => order.id === action.payload.orderId;
      if (state.data?.recent_orders) {
        const order = state.data.recent_orders.find(updateFn);
        if (order) order.status = action.payload.status;
      }
      const order = state.ordersList.find(updateFn);
      if (order) order.status = action.payload.status;
    },
    updateTableStatusLocal: (
      state,
      action: PayloadAction<{ tableId: string; status: Table["status"] }>,
    ) => {
      const updateFn = (table: Table) => table.id === action.payload.tableId;
      if (state.data?.tables) {
        const table = state.data.tables.find(updateFn);
        if (table) table.status = action.payload.status;
      }
      const table = state.tablesList.find(updateFn);
      if (table) table.status = action.payload.status;
    },
    updateStaffStatusLocal: (
      state,
      action: PayloadAction<{ staffId: string; status: "active" | "inactive" }>,
    ) => {
      const updateFn = (staff: Staff) => staff.id === action.payload.staffId;
      if (state.data?.staff) {
        const staff = state.data.staff.find(updateFn);
        if (staff) {
          staff.status = action.payload.status;
          staff.is_active = action.payload.status === "active";
        }
      }
      const staff = state.staffList.find(updateFn);
      if (staff) {
        staff.status = action.payload.status;
        staff.is_active = action.payload.status === "active";
      }
    },
    updateInventoryStatusLocal: (
      state,
      action: PayloadAction<{
        inventoryId: string;
        status: InventoryItem["status"];
      }>,
    ) => {
      const updateFn = (item: InventoryItem) =>
        item.id === action.payload.inventoryId;
      if (state.data?.inventory) {
        const item = state.data.inventory.find(updateFn);
        if (item) item.status = action.payload.status;
      }
      const item = state.inventoryList.find(updateFn);
      if (item) item.status = action.payload.status;
    },
    updateKitchenOrderStatusLocal: (
      state,
      action: PayloadAction<{
        orderId: string;
        status: KitchenOrder["status"];
      }>,
    ) => {
      const updateFn = (order: KitchenOrder) =>
        order.id === action.payload.orderId;
      if (state.data?.kitchen_orders) {
        const order = state.data.kitchen_orders.find(updateFn);
        if (order) order.status = action.payload.status;
      }
      const order = state.kitchenOrdersList.find(updateFn);
      if (order) order.status = action.payload.status;
    },
    addInventoryItemLocal: (state, action: PayloadAction<InventoryItem>) => {
      state.inventoryList = [action.payload, ...state.inventoryList];
      if (state.data)
        state.data.inventory = [action.payload, ...state.data.inventory];
    },
    removeInventoryItemLocal: (state, action: PayloadAction<string>) => {
      state.inventoryList = state.inventoryList.filter(
        (i) => i.id !== action.payload,
      );
      if (state.data)
        state.data.inventory = state.data.inventory.filter(
          (i) => i.id !== action.payload,
        );
    },
    setDashboardData: (state, action: PayloadAction<DashboardData>) => {
      state.data = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Staff
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.staffList = action.payload;
        if (state.data) state.data.staff = action.payload;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.staffList = [action.payload, ...state.staffList];
        if (state.data)
          state.data.staff = [action.payload, ...(state.data.staff || [])];
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.staffList = state.staffList.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        );
        if (state.data)
          state.data.staff = (state.data.staff || []).map((s) =>
            s.id === action.payload.id ? action.payload : s,
          );
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.staffList = state.staffList.filter(
          (s) => s.id !== action.payload,
        );
        if (state.data)
          state.data.staff = (state.data.staff || []).filter(
            (s) => s.id !== action.payload,
          );
      })
      .addCase(toggleStaffStatus.fulfilled, (state, action) => {
        state.staffList = state.staffList.map((staff) =>
          staff.id === action.payload.id ? action.payload : staff,
        );

        if (state.data) {
          state.data.staff = (state.data.staff || []).map((staff) =>
            staff.id === action.payload.id ? action.payload : staff,
          );
        }
      })
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesList = action.payload;
        if (state.data) state.data.categories = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        if (action.payload) {
          state.categoriesList = [action.payload, ...state.categoriesList];
          if (state.data)
            state.data.categories = [
              action.payload,
              ...(state.data.categories || []),
            ];
        }
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (action.payload) {
          state.categoriesList = state.categoriesList.map((c) =>
            c.id === action.payload.id ? action.payload : c,
          );
          if (state.data)
            state.data.categories = (state.data.categories || []).map((c) =>
              c.id === action.payload.id ? action.payload : c,
            );
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categoriesList = state.categoriesList.filter(
          (c) => c.id !== action.payload,
        );
        if (state.data)
          state.data.categories = (state.data.categories || []).filter(
            (c) => c.id !== action.payload,
          );
      })
      // Menu Items
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.menuItemsList = action.payload;
        if (state.data) state.data.menu_items = action.payload;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.menuItemsList = [action.payload, ...state.menuItemsList];
        if (state.data)
          state.data.menu_items = [
            action.payload,
            ...(state.data.menu_items || []),
          ];
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.menuItemsList = state.menuItemsList.map((m) =>
          m.id === action.payload.id ? action.payload : m,
        );
        if (state.data)
          state.data.menu_items = (state.data.menu_items || []).map((m) =>
            m.id === action.payload.id ? action.payload : m,
          );
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.menuItemsList = state.menuItemsList.filter(
          (m) => m.id !== action.payload,
        );
        if (state.data)
          state.data.menu_items = (state.data.menu_items || []).filter(
            (m) => m.id !== action.payload,
          );
      })
      // Tables
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.tablesList = action.payload;
        if (state.data) state.data.tables = action.payload;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        if (action.payload) {
          state.tablesList = [action.payload, ...state.tablesList];
          if (state.data)
            state.data.tables = [action.payload, ...state.data.tables];
        }
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        if (action.payload) {
          state.tablesList = state.tablesList.map((t) =>
            t.id === action.payload.id ? action.payload : t,
          );
          if (state.data)
            state.data.tables = state.data.tables.map((t) =>
              t.id === action.payload.id ? action.payload : t,
            );
        }
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.tablesList = state.tablesList.map((t) =>
            t.id === action.payload.id ? action.payload : t,
          );
          if (state.data)
            state.data.tables = state.data.tables.map((t) =>
              t.id === action.payload.id ? action.payload : t,
            );
        }
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.tablesList = state.tablesList.filter(
          (t) => t.id !== action.payload,
        );
        if (state.data)
          state.data.tables = state.data.tables.filter(
            (t) => t.id !== action.payload,
          );
      })
      // Inventory
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.inventoryList = action.payload;
        if (state.data) state.data.inventory = action.payload;
      })
      .addCase(fetchInventoryCategories.fulfilled, (state, action) => {
        state.inventoryCategories = action.payload;
      })
      .addCase(fetchInventoryTransactions.fulfilled, (state, action) => {
        state.inventoryTransactions = action.payload;
      })
      .addCase(fetchLowStockInventory.fulfilled, (state, action) => {
        const lowStockIds = new Set(action.payload.map((i) => i.id));
        const merged = state.inventoryList.map((i) =>
          lowStockIds.has(i.id)
            ? (action.payload.find((li) => li.id === i.id) ?? i)
            : i,
        );
        action.payload.forEach((i) => {
          if (!state.inventoryList.find((li) => li.id === i.id)) merged.push(i);
        });
        state.inventoryList = merged;
      })
      .addCase(fetchExpiringSoonInventory.fulfilled, (state, action) => {
        const expiringIds = new Set(action.payload.map((i) => i.id));
        const merged = state.inventoryList.map((i) =>
          expiringIds.has(i.id)
            ? (action.payload.find((ei) => ei.id === i.id) ?? i)
            : i,
        );
        action.payload.forEach((i) => {
          if (!state.inventoryList.find((li) => li.id === i.id)) merged.push(i);
        });
        state.inventoryList = merged;
      })
      .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
        state.inventoryValuation = action.payload;
      })
      .addCase(fetchInventoryAlerts.fulfilled, (state, action) => {
        state.inventoryAlerts = action.payload;
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.inventoryList = [action.payload, ...state.inventoryList];
        if (state.data)
          state.data.inventory = [action.payload, ...state.data.inventory];
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        state.inventoryList = state.inventoryList.map((i) =>
          i.id === action.payload.id ? action.payload : i,
        );
        if (state.data)
          state.data.inventory = state.data.inventory.map((i) =>
            i.id === action.payload.id ? action.payload : i,
          );
      })
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.inventoryList = state.inventoryList.filter(
          (i) => i.id !== action.payload,
        );
        if (state.data)
          state.data.inventory = state.data.inventory.filter(
            (i) => i.id !== action.payload,
          );
      })
      .addCase(createInventoryTransaction.fulfilled, (state, action) => {
        state.inventoryTransactions = [
          action.payload,
          ...state.inventoryTransactions,
        ];
      })
      .addCase(markInventoryAlertRead.fulfilled, (state, action) => {
        const alert = state.inventoryAlerts.find(
          (a) => a.id === action.payload,
        );
        if (alert) alert.is_read = true;
      })
      .addCase(resolveInventoryAlert.fulfilled, (state, action) => {
        const alert = state.inventoryAlerts.find(
          (a) => a.id === action.payload,
        );
        if (alert) {
          alert.is_resolved = true;
          alert.resolved_at = new Date().toISOString();
        }
      })
      // Orders
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.ordersList = action.payload;
        if (state.data) state.data.recent_orders = action.payload;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        if (action.payload) {
          state.ordersList = [action.payload, ...state.ordersList];
          if (state.data)
            state.data.recent_orders = [
              action.payload,
              ...(state.data.recent_orders || []),
            ];
        }
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        if (updatedOrder) {
          state.ordersList = state.ordersList.map((o) =>
            o.id === updatedOrder.id ? updatedOrder : o,
          );
          if (state.data?.recent_orders) {
            state.data.recent_orders = state.data.recent_orders.map((o) =>
              o.id === updatedOrder.id ? updatedOrder : o,
            );
          }
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.ordersList = state.ordersList.map((o) =>
            o.id === action.payload.id ? action.payload : o,
          );
          if (state.data?.recent_orders) {
            state.data.recent_orders = state.data.recent_orders.map((o) =>
              o.id === action.payload.id ? action.payload : o,
            );
          }
        }
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.ordersList = state.ordersList.map((o) =>
            o.id === action.payload.id ? action.payload : o,
          );
          if (state.data?.recent_orders) {
            state.data.recent_orders = state.data.recent_orders.map((o) =>
              o.id === action.payload.id ? action.payload : o,
            );
          }
        }
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.ordersList = state.ordersList.filter(
          (o) => o.id !== action.payload,
        );
        if (state.data?.recent_orders) {
          state.data.recent_orders = state.data.recent_orders.filter(
            (o) => o.id !== action.payload,
          );
        }
      })
      // Kitchen Orders
      .addCase(fetchKitchenOrders.fulfilled, (state, action) => {
        state.kitchenOrdersList = action.payload;
        if (state.data) state.data.kitchen_orders = action.payload;
      })
      .addCase(updateKitchenItemStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.kitchenOrdersList = state.kitchenOrdersList.map((ko) => {
            if (ko.order_id === action.payload.order_id) {
              return {
                ...ko,
                items: Array.isArray(ko.items)
                  ? ko.items.map((item: any) =>
                      item.id === action.payload.id
                        ? { ...item, status: action.payload.status }
                        : item,
                    )
                  : ko.items,
              };
            }
            return ko;
          });
        }
      })
      // Hotel Profile
      .addCase(updateHotelProfile.fulfilled, (state, action) => {
        if (state.data?.hotel) {
          state.data.hotel = { ...state.data.hotel, ...action.payload };
        } else if (state.data) {
          state.data.hotel = action.payload;
        }
        state.lastFetched = new Date().toISOString();
      })
      .addCase(updateHotelProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.paymentMethodsLoading = true;
        state.paymentMethodsError = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethodsError = action.payload as string;
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = [action.payload, ...state.paymentMethods];
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.map((method) =>
          method.id === action.payload.id ? action.payload : method,
        );
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.filter(
          (method) => method.id !== action.payload,
        );
      });
  },
});

export const {
  clearDashboardError,
  updateOrderStatusLocal,
  updateTableStatusLocal,
  updateStaffStatusLocal,
  updateInventoryStatusLocal,
  updateKitchenOrderStatusLocal,
  addInventoryItemLocal,
  removeInventoryItemLocal,
  setDashboardData,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
