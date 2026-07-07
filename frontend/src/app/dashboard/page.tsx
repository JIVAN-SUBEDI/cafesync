'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard,
  User,
  Users,
  FolderTree,
  UtensilsCrossed,
  Table as TableIcon,
  Receipt,
  ChefHat,
  Package,
  Settings,
  Bell,
  Search,
  Calendar,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  MoreVertical,
  ChevronDown,
  LogOut,
  Menu,
  Home,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  BarChart3,
  PieChart,
  Plus,
  Star,
  TrendingUp,
  Target,
  Shield,
  X,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import BillingView from '@/components/ui/BillingView'

// ===================== TYPES =====================
interface Hotel {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  subscription: {
    plan: string;
    status: 'active' | 'trial' | 'suspended';
    endsAt: Date;
  };
}
interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  items: number;
  time: string;
  waiter?: string;
}

interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'waiter' | 'chef' | 'cashier' | 'cleaner';
  status: 'active' | 'offline' | 'on_break';
  todayOrders: number;
  phone?: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  popularity: number;
  availability: boolean;
  categoryId?: string;
}

interface Table {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  waiter?: string;
  orderAmount?: number;
  section?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count?: number;
  component: 'dashboard' | 'profile' | 'staff' | 'category' | 'menu' | 'tables' | 'orders' | 'kitchen'  | 'billing';
}

// ===================== DUMMY DATA =====================
const HOTEL: Hotel = {
  id: '1',
  name: 'Grand Plaza Hotel',
  slug: 'grand-plaza',
  address: '123 Luxury Avenue, New York, NY 10001',
  phone: '+1 (555) 123-4567',
  email: 'contact@grandplaza.com',
  subscription: {
    plan: 'Business Plan',
    status: 'active',
    endsAt: new Date('2024-12-31')
  }
}

const ORDERS: Order[] = [
  { id: '1', tableNumber: 'T-12', customerName: 'John Smith', amount: 85.50, status: 'served', items: 4, time: '12:30 PM', waiter: 'James Wilson' },
  { id: '2', tableNumber: 'T-05', customerName: 'Emma Wilson', amount: 42.00, status: 'preparing', items: 2, time: '1:15 PM', waiter: 'Maria Garcia' },
  { id: '3', tableNumber: 'VIP-1', customerName: 'Robert Chen', amount: 156.75, status: 'pending', items: 6, time: '1:45 PM' },
  { id: '4', tableNumber: 'T-08', customerName: 'Sarah Johnson', amount: 63.25, status: 'ready', items: 3, time: '2:00 PM', waiter: 'Tom Clark' },
  { id: '5', tableNumber: 'T-15', customerName: 'Michael Brown', amount: 92.80, status: 'completed', items: 5, time: '2:30 PM', waiter: 'James Wilson' },
  { id: '6', tableNumber: 'T-03', customerName: 'Lisa Garcia', amount: 78.40, status: 'pending', items: 4, time: '3:00 PM' },
]

const STAFF: Staff[] = [
  { id: '1', name: 'James Wilson', role: 'manager', status: 'active', todayOrders: 12, phone: '+1 (555) 111-2233' },
  { id: '2', name: 'Maria Garcia', role: 'waiter', status: 'active', todayOrders: 8, phone: '+1 (555) 222-3344' },
  { id: '3', name: 'David Lee', role: 'chef', status: 'on_break', todayOrders: 0, phone: '+1 (555) 333-4455' },
  { id: '4', name: 'Sarah Miller', role: 'cashier', status: 'active', todayOrders: 20, phone: '+1 (555) 444-5566' },
  { id: '5', name: 'Tom Clark', role: 'waiter', status: 'offline', todayOrders: 4, phone: '+1 (555) 555-6677' },
  { id: '6', name: 'Anna Brown', role: 'cleaner', status: 'active', todayOrders: 0, phone: '+1 (555) 666-7788' },
]

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Grilled Salmon', category: 'Main Course', price: 24.99, popularity: 95, availability: true, categoryId: 'main' },
  { id: '2', name: 'Caesar Salad', category: 'Appetizer', price: 12.99, popularity: 88, availability: true, categoryId: 'appetizer' },
  { id: '3', name: 'Chocolate Lava Cake', category: 'Dessert', price: 8.99, popularity: 92, availability: true, categoryId: 'dessert' },
  { id: '4', name: 'Ribeye Steak', category: 'Main Course', price: 32.99, popularity: 78, availability: false, categoryId: 'main' },
  { id: '5', name: 'Mango Smoothie', category: 'Beverage', price: 6.99, popularity: 85, availability: true, categoryId: 'beverage' },
  { id: '6', name: 'Garlic Bread', category: 'Appetizer', price: 7.99, popularity: 90, availability: true, categoryId: 'appetizer' },
]

const TABLES: Table[] = [
  { id: '1', number: 'T-01', name: 'Window View', capacity: 4, status: 'available', section: 'Main Hall' },
  { id: '2', number: 'T-02', capacity: 2, status: 'occupied', waiter: 'James Wilson', orderAmount: 45.50, section: 'Main Hall' },
  { id: '3', number: 'T-03', capacity: 6, status: 'available', section: 'Terrace' },
  { id: '4', number: 'VIP-1', name: 'Private Booth', capacity: 4, status: 'reserved', orderAmount: 120.00, section: 'VIP Area' },
  { id: '5', number: 'T-05', capacity: 8, status: 'occupied', waiter: 'Maria Garcia', orderAmount: 189.75, section: 'Main Hall' },
  { id: '6', number: 'T-06', capacity: 2, status: 'cleaning', section: 'Terrace' },
  { id: '7', number: 'T-07', capacity: 4, status: 'available', section: 'Main Hall' },
  { id: '8', number: 'T-08', capacity: 6, status: 'occupied', waiter: 'Tom Clark', orderAmount: 96.30, section: 'Terrace' },
]

const CATEGORIES = [
  { id: 'main', name: 'Main Course', items: 15, active: true },
  { id: 'appetizer', name: 'Appetizer', items: 8, active: true },
  { id: 'dessert', name: 'Dessert', items: 6, active: true },
  { id: 'beverage', name: 'Beverage', items: 12, active: true },
  { id: 'special', name: 'Special Menu', items: 4, active: false },
]

const INVENTORY_ITEMS = [
  { id: '1', name: 'Fresh Salmon', category: 'Seafood', quantity: 2, unit: 'kg', minQuantity: 5, status: 'low' },
  { id: '2', name: 'Chicken Breast', category: 'Poultry', quantity: 15, unit: 'kg', minQuantity: 10, status: 'good' },
  { id: '3', name: 'Avocado', category: 'Produce', quantity: 5, unit: 'pieces', minQuantity: 20, status: 'low' },
  { id: '4', name: 'Fresh Basil', category: 'Herbs', quantity: 100, unit: 'g', minQuantity: 200, status: 'low' },
  { id: '5', name: 'Rice', category: 'Grains', quantity: 25, unit: 'kg', minQuantity: 10, status: 'good' },
  { id: '6', name: 'Olive Oil', category: 'Oil', quantity: 3, unit: 'liters', minQuantity: 5, status: 'medium' },
]

const KITCHEN_ORDERS = [
  { id: '1', table: 'T-05', items: ['Grilled Salmon', 'Caesar Salad'], status: 'preparing', time: '12 min', chef: 'David Lee' },
  { id: '2', table: 'T-08', items: ['Ribeye Steak', 'Garlic Bread'], status: 'ready', time: 'Ready', chef: 'Sous Chef' },
  { id: '3', table: 'VIP-1', items: ['Special Platter', 'Wine'], status: 'pending', time: '25 min', chef: 'David Lee' },
  { id: '4', table: 'T-02', items: ['Pasta', 'Salad'], status: 'preparing', time: '15 min', chef: 'Sous Chef' },
]

const SIDEBAR_ITEMS_INITIAL: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true, component: 'dashboard' },
  { id: 'profile', label: 'Profile', icon: <User size={20} />, active: false, component: 'profile' },
  { id: 'staff', label: 'Staff', icon: <Users size={20} />, active: false, count: 15, component: 'staff' },
  { id: 'category', label: 'Menu Category', icon: <FolderTree size={20} />, active: false, count: 8, component: 'category' },
  { id: 'menu', label: 'Menu', icon: <UtensilsCrossed size={20} />, active: false, count: 45, component: 'menu' },
  { id: 'tables', label: 'Tables', icon: <TableIcon size={20} />, active: false, count: 25, component: 'tables' },
  { id: 'orders', label: 'Orders', icon: <Receipt size={20} />, active: false, count: 24, component: 'orders' },
  { id: 'kitchen', label: 'Kitchen', icon: <ChefHat size={20} />, active: false, count: 12, component: 'kitchen' },
]

const STATS = [
  { label: 'Today\'s Revenue', value: '$2,845', change: '+12.5%', icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { label: 'Active Orders', value: '18', change: '+3 today', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { label: 'Table Occupancy', value: '68%', change: '+8%', icon: <TableIcon className="h-5 w-5" />, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { label: 'Staff Active', value: '8/15', change: '+2 online', icon: <Users className="h-5 w-5" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
]

// ===================== COMPONENTS =====================

function Sidebar({ 
  items, 
  hotel,
  isMobileOpen,
  onClose,
  onLogout,
  onItemClick
}: { 
  items: SidebarItem[],
  hotel: Hotel,
  isMobileOpen: boolean,
  onClose: () => void,
  onLogout: () => void,
  onItemClick: (component: string) => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200
        transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-300 z-50
        flex flex-col
      `}>
        {/* Hotel Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            {/* <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"> */}
              {/* <Home className="h-6 w-6 text-white" /> */}
              <img src="./globe.svg" alt="photo" className='h-6 w-6 text-white' />
            {/* </div> */}
            <div>
              <h2 className="font-bold text-gray-900">{hotel.name}</h2>
              <p className="text-sm text-gray-500">@{hotel.slug}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              {hotel.phone}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {hotel.email}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick(item.component)
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${item.active 
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-100' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={item.active ? 'text-blue-500' : 'text-gray-500'}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`
                    px-2 py-1 text-xs font-semibold rounded-full
                    ${item.active 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Settings Section */}
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              <CreditCard size={20} />
              <span className="font-medium">Billing</span>
            </button>
          </div>
        </nav>

        {/* Subscription Status */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-700">{hotel.subscription.plan}</span>
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mb-2">
              {hotel.subscription.status === 'active' ? 'Active' : 'Trial'} • Ends {hotel.subscription.endsAt.toLocaleDateString()}
            </p>
            <div className="w-full bg-blue-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function Header({ 
  onMenuClick,
  hotel,
  currentView
}: { 
  onMenuClick: () => void,
  hotel: Hotel,
  currentView: string
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const viewTitles = {
    dashboard: 'Dashboard',
    profile: 'Hotel Profile',
    staff: 'Staff Management',
    category: 'Menu Categories',
    menu: 'Menu Items',
    tables: 'Table Management',
    orders: 'Orders',
    kitchen: 'Kitchen Display',
    inventory: 'Inventory'
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">{viewTitles[currentView as keyof typeof viewTitles]}</h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  {hotel.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">Hotel Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Signed in as</p>
                    <p className="text-xs text-gray-600 truncate">{hotel.email}</p>
                  </div>
                  <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    Account Settings
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    Billing & Subscription
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ===================== MAIN COMPONENTS FOR EACH SECTION =====================

function DashboardView() {
  const getStatusColor = (status: Order['status']) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-amber-100 text-amber-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'served': return <CheckCircle className="h-4 w-4" />;
      case 'ready': return <CheckCircle2 className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Welcome back, Hotel Admin!</h1>
            <p className="text-blue-100">Here's what's happening with your hotel today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-200">Current Time</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
            <div className="h-10 w-0.5 bg-white/30"></div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Hotel Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">Today</span>
                <p className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-600">Today's order activity</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {ORDERS.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Table {order.tableNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Status */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Table Status</h3>
                <p className="text-sm text-gray-600">Current table occupancy</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {TABLES.slice(0, 6).map((table) => {
                const statusColor = table.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                                 table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                 table.status === 'reserved' ? 'bg-amber-100 text-amber-800' :
                                 'bg-gray-100 text-gray-800';
                return (
                  <div key={table.id} className={`
                    border rounded-lg p-3 text-center transition-colors
                    ${table.status === 'available' ? 'border-emerald-200 hover:border-emerald-300' :
                      table.status === 'occupied' ? 'border-red-200 hover:border-red-300' :
                      table.status === 'reserved' ? 'border-amber-200 hover:border-amber-300' :
                      'border-gray-200 hover:border-gray-300'}
                  `}>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor} mb-2`}>
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </div>
                    <p className="text-lg font-bold text-gray-900">{table.number}</p>
                    <p className="text-sm text-gray-600">{table.capacity} seats</p>
                    {table.waiter && (
                      <p className="text-xs text-gray-700 mt-1">
                        Waiter: <span className="font-medium">{table.waiter}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Staff & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Overview */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Staff Overview</h3>
                <p className="text-sm text-gray-600">Current staff activity</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {STAFF.map((staff) => {
                const statusColor = staff.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                   staff.status === 'on_break' ? 'bg-amber-100 text-amber-800' :
                                   'bg-gray-100 text-gray-800';
                return (
                  <div key={staff.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.full_name}</p>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {staff.status.replace('_', ' ')}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{staff.todayOrders} orders</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Inventory Alert */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Inventory Alert</h3>
                <p className="text-sm text-gray-600">Items running low</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {INVENTORY_ITEMS.filter(item => item.status === 'low').map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-gray-600">Min: {item.minQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileView({ hotel }: { hotel: Hotel }) {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">{hotel.name}</h1>
            <p className="text-blue-100">Hotel Profile & Settings</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Hotel Details Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Hotel Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                <p className="text-gray-900">{hotel.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Slug</label>
                <p className="text-gray-900">@{hotel.slug}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{hotel.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-900">{hotel.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{hotel.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {hotel.subscription.plan}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    hotel.subscription.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {hotel.subscription.status.charAt(0).toUpperCase() + hotel.subscription.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription End Date</label>
                <p className="text-gray-900">{hotel.subscription.endsAt.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Hotel Settings</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate</label>
                <p className="text-gray-900">10%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge</label>
                <p className="text-gray-900">5%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <p className="text-gray-900">USD ($)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                <p className="text-gray-900">Eastern Time (UTC-5)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <p className="text-gray-900">United States</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours Card */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Hours</h3>
          
          <div className="space-y-3">
            {[
              { day: 'Monday', hours: '8:00 AM - 10:00 PM' },
              { day: 'Tuesday', hours: '8:00 AM - 10:00 PM' },
              { day: 'Wednesday', hours: '8:00 AM - 10:00 PM' },
              { day: 'Thursday', hours: '8:00 AM - 10:00 PM' },
              { day: 'Friday', hours: '8:00 AM - 11:00 PM' },
              { day: 'Saturday', hours: '9:00 AM - 11:00 PM' },
              { day: 'Sunday', hours: '9:00 AM - 9:00 PM' },
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-900">{schedule.day}</span>
                <span className="text-gray-700">{schedule.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StaffView() {
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'waiter': return 'bg-blue-100 text-blue-800';
      case 'chef': return 'bg-amber-100 text-amber-800';
      case 'cashier': return 'bg-emerald-100 text-emerald-800';
      case 'cleaner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'on_break': return 'bg-amber-100 text-amber-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Staff Management</h1>
            <p className="text-blue-100">Manage your hotel staff and their permissions</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-gray-900">15</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active Now</p>
          <p className="text-2xl font-bold text-gray-900">8</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">On Break</p>
          <p className="text-2xl font-bold text-gray-900">2</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Offline</p>
          <p className="text-2xl font-bold text-gray-900">5</p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Staff Members</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Filter className="h-4 w-4 inline mr-1" />
                Filter
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Download className="h-4 w-4 inline mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Staff Member</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Today's Orders</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {STAFF.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-600">ID: STAFF-{staff.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                      {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-700">{staff.phone}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                      {staff.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{staff.todayOrders}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CategoryView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Menu Categories</h1>
            <p className="text-blue-100">Organize your menu items by categories</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.active 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{category.items} menu items</p>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
                Edit
              </button>
              <button className="flex-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                View Items
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MenuView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Menu Items</h1>
            <p className="text-blue-100">Manage your hotel's menu items and pricing</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Menu Items</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Filter className="h-4 w-4 inline mr-1" />
                Filter
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Item Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Popularity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MENU_ITEMS.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.availability ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <UtensilsCrossed className={`h-4 w-4 ${item.availability ? 'text-emerald-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">${item.price.toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${item.popularity}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700">{item.popularity}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.availability 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.availability ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TablesView() {
  const getTableStatus = (table: Table) => {
    switch(table.status) {
      case 'available':
        return {
          color: 'bg-emerald-100 text-emerald-800',
          label: 'Available'
        }
      case 'occupied':
        return {
          color: 'bg-red-100 text-red-800',
          label: 'Occupied'
        }
      case 'reserved':
        return {
          color: 'bg-amber-100 text-amber-800',
          label: 'Reserved'
        }
      case 'cleaning':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Cleaning'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          label: 'Unknown'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Table Management</h1>
            <p className="text-blue-100">Manage your hotel tables and seating</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Table Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Tables</p>
          <p className="text-2xl font-bold text-gray-900">25</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Available</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Occupied</p>
          <p className="text-2xl font-bold text-gray-900">8</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Reserved</p>
          <p className="text-2xl font-bold text-gray-900">5</p>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Tables</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Filter className="h-4 w-4 inline mr-1" />
                Filter by Section
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TABLES.map((table) => {
              const status = getTableStatus(table)
              return (
                <div key={table.id} className={`
                  border rounded-lg p-4 text-center transition-all hover:scale-105
                  ${table.status === 'available' 
                    ? 'border-emerald-200 hover:border-emerald-300' 
                    : table.status === 'occupied'
                    ? 'border-red-200 hover:border-red-300'
                    : table.status === 'reserved'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-blue-200 hover:border-blue-300'
                  }
                `}>
                  <div className="mb-3">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-900">{table.number}</p>
                    <p className="text-sm text-gray-600">{table.capacity} seats</p>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {table.section}
                  </div>
                  
                  {table.waiter && (
                    <p className="text-sm text-gray-700">
                      Waiter: <span className="font-medium">{table.waiter}</span>
                    </p>
                  )}
                  
                  {table.orderAmount && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      ${table.orderAmount.toFixed(2)}
                    </p>
                  )}
                  
                  <div className="mt-3 flex justify-center gap-2">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== MAIN DASHBOARD PAGE =====================
export default function DashboardPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'staff' | 'category' | 'menu' | 'tables' | 'orders' | 'kitchen' | 'billing'>('dashboard')
  const [sidebarItems, setSidebarItems] = useState(SIDEBAR_ITEMS_INITIAL)

  const handleLogout = () => {
    toast.success('Logged out successfully!', {
      icon: '👋',
      style: {
        background: '#1f2937',
        color: '#fff',
        borderRadius: '8px',
        border: '1px solid #374151',
      },
    })
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  const handleItemClick = (component: string) => {
    const updatedItems = sidebarItems.map(item => ({
      ...item,
      active: item.component === component
    }))
    setSidebarItems(updatedItems)
    setCurrentView(component as any)
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'profile':
        return <ProfileView hotel={HOTEL} />
      case 'staff':
        return <StaffView />
      case 'category':
        return <CategoryView />
      case 'menu':
        return <MenuView />
      case 'tables':
        return <TablesView />
      case 'orders':
        return <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">Orders View</h3>
          <p className="text-gray-600 mt-2">Orders management interface will be implemented here</p>
        </div>
      case 'kitchen':
        return <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">Kitchen View</h3>
          <p className="text-gray-600 mt-2">Kitchen display interface will be implemented here</p>
        </div>
      // case 'inventory':
      //   return <div className="text-center py-12">
      //     <h3 className="text-lg font-semibold text-gray-900">Inventory View</h3>
      //     <p className="text-gray-600 mt-2">Inventory management interface will be implemented here</p>
      //   </div>
      case 'billing':
        return <BillingView  />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '8px',
            border: '1px solid #374151',
          },
        }}
      />
      
      <Sidebar 
        items={sidebarItems}
        hotel={HOTEL}
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        onItemClick={handleItemClick}
      />
      
      <div className="flex-1 flex flex-col">
              {/* <div className="lg:pl-64"> */}

        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          hotel={HOTEL}
          currentView={currentView}
        />
        
        <main className="p-4 md:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  )
}