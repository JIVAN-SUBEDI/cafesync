// // components/admin/AdminSidebar.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import {
//   LayoutDashboard,
//   Building2,
//   CreditCard,
//   Users,
//   Settings,
//   LogOut,
//   ChevronLeft,
//   ChevronRight,
//   Menu,
//   Bell,
//   Search,
//   BarChart3,
//   Package,
//   ShoppingCart,
//   FileText,
//   Shield,
//   HelpCircle,
//   ChevronDown
// } from 'lucide-react';
// import { useDispatch } from 'react-redux';
// import { AppDispatch } from '@/store';
// import { logoutAdmin } from '@/store/slices/authSlice';

// interface SidebarProps {
//   isCollapsed: boolean;
//   onToggle: () => void;
// }

// interface NavItem {
//   name: string;
//   href: string;
//   icon: React.ElementType;
//   badge?: number;
//   children?: NavItem[];
// }

// const navigation: NavItem[] = [
//   {
//     name: 'Dashboard',
//     href: '/admin/dashboard',
//     icon: LayoutDashboard
//   },
//   {
//     name: 'Hotels',
//     href: '/admin/hotels',
//     icon: Building2,
//     badge: 12
//   },
//   {
//     name: 'Subscriptions',
//     href: '/admin/subscriptions',
//     icon: CreditCard,
//     children: [
//       { name: 'All Plans', href: '/admin/subscriptions', icon: CreditCard },
//       { name: 'Create Plan', href: '/admin/subscriptions/create', icon: CreditCard },
//       { name: 'Invoices', href: '/admin/subscriptions/invoices', icon: FileText }
//     ]
//   },

//   {
//     name: 'Settings',
//     href: '/admin/settings',
//     icon: Settings
//   },
// ];

// const bottomNav: NavItem[] = [
//   { name: 'Help', href: '/admin/help', icon: HelpCircle },
//   { name: 'Security', href: '/admin/security', icon: Shield },
// ];

// export default function AdminSidebar({ isCollapsed, onToggle }: SidebarProps) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const dispatch = useDispatch<AppDispatch>();
//   const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   const toggleMenu = (name: string) => {
//     setExpandedMenus(prev =>
//       prev.includes(name)
//         ? prev.filter(item => item !== name)
//         : [...prev, name]
//     );
//   };

//   const handleLogout = async () => {
//     await dispatch(logoutAdmin());
//     router.push('/admin/login');
//   };

//   const isActive = (href: string) => {
//     if (href === '/admin/dashboard') {
//       return pathname === href;
//     }
//     return pathname.startsWith(href);
//   };

//   const renderNavItem = (item: NavItem, depth = 0) => {
//     const active = isActive(item.href);
//     const hasChildren = item.children && item.children.length > 0;
//     const isExpanded = expandedMenus.includes(item.name);

//     return (
//       <div key={item.name} className="relative">
//         {hasChildren ? (
//           <>
//             <button
//               onClick={() => toggleMenu(item.name)}
//               className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//                 active
//                   ? 'bg-blue-50 text-blue-600'
//                   : 'text-gray-700 hover:bg-gray-100'
//               } ${depth > 0 ? 'ml-4' : ''}`}
//             >
//               <div className="flex items-center gap-3">
//                 <item.icon className="h-5 w-5" />
//                 {!isCollapsed && <span>{item.name}</span>}
//                 {item.badge && !isCollapsed && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </div>
//               {!isCollapsed && (
//                 <ChevronDown
//                   className={`h-4 w-4 transition-transform ${
//                     isExpanded ? 'rotate-180' : ''
//                   }`}
//                 />
//               )}
//             </button>
//             {!isCollapsed && isExpanded && item.children && (
//               <div className="mt-1 space-y-1">
//                 {item.children.map(child => renderNavItem(child, depth + 1))}
//               </div>
//             )}
//           </>
//         ) : (
//           <Link
//             href={item.href}
//             className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//               active
//                 ? 'bg-blue-50 text-blue-600'
//                 : 'text-gray-700 hover:bg-gray-100'
//             } ${depth > 0 ? 'ml-4' : ''}`}
//           >
//             <item.icon className="h-5 w-5" />
//             {!isCollapsed && (
//               <>
//                 <span>{item.name}</span>
//                 {item.badge && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </>
//             )}
//           </Link>
//         )}
//       </div>
//     );
//   };

//   // Mobile menu
//   if (isMobile) {
//     return (
//       <>
//         {/* Mobile header */}
//         <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
//           <div className="flex items-center justify-between p-4">
//             <button
//               onClick={() => setShowMobileMenu(true)}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               <Menu className="h-6 w-6" />
//             </button>
//             <h1 className="text-lg font-bold text-blue-600">Hotel Admin</h1>
//             <button className="p-2 hover:bg-gray-100 rounded-lg">
//               <Bell className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         {/* Mobile menu overlay */}
//         {showMobileMenu && (
//           <div className="fixed inset-0 z-50 flex">
//             <div
//               className="fixed inset-0 bg-black bg-opacity-50"
//               onClick={() => setShowMobileMenu(false)}
//             />
//             <div className="relative w-64 bg-white h-full overflow-y-auto">
//               <div className="p-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-xl font-bold text-blue-600">Menu</h2>
//                   <button
//                     onClick={() => setShowMobileMenu(false)}
//                     className="p-2 hover:bg-gray-100 rounded-lg"
//                   >
//                     <ChevronLeft className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//               <nav className="p-4 space-y-1">
//                 {navigation.map(item => renderNavItem(item))}
//                 <div className="border-t border-gray-200 my-4 pt-4">
//                   {bottomNav.map(item => renderNavItem(item))}
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 >
//                   <LogOut className="h-5 w-5" />
//                   <span>Logout</span>
//                 </button>
//               </nav>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   }

//   // Desktop sidebar
//   return (
//     <div
//       className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
//         isCollapsed ? 'w-20' : 'w-64'
//       }`}
//     >
//       {/* Logo */}
//       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
//         {!isCollapsed ? (
//           <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
//         ) : (
//           <h1 className="text-xl font-bold text-blue-600 mx-auto">A</h1>
//         )}
//         <button
//           onClick={onToggle}
//           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           {isCollapsed ? (
//             <ChevronRight className="h-5 w-5" />
//           ) : (
//             <ChevronLeft className="h-5 w-5" />
//           )}
//         </button>
//       </div>

//       {/* Search (expanded only) */}
//       {!isCollapsed && (
//         <div className="p-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       )}

//       {/* Navigation */}
//       <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
//         {navigation.map(item => renderNavItem(item))}
//       </nav>

//       {/* Bottom section */}
//       <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
//         <div className="space-y-1">
//           {bottomNav.map(item => renderNavItem(item))}
//           <button
//             onClick={handleLogout}
//             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
//               isCollapsed ? 'justify-center' : ''
//             }`}
//           >
//             <LogOut className="h-5 w-5" />
//             {!isCollapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // components/admin/AdminSidebar.tsx
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import {
//   LayoutDashboard,
//   Building2,
//   CreditCard,
//   Users,
//   Settings,
//   LogOut,
//   ChevronLeft,
//   ChevronRight,
//   Menu,
//   Bell,
//   Search,
//   BarChart3,
//   FileText,
//   Shield,
//   HelpCircle,
//   ChevronDown,
//   Fingerprint
// } from "lucide-react";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store";
// import { logoutAdmin } from "@/store/slices/authSlice";

// interface SidebarProps {
//   isCollapsed: boolean;
//   onToggle: () => void;
// }

// interface NavItem {
//   name: string;
//   href: string;
//   icon: React.ElementType;
//   badge?: number;
//   children?: NavItem[];
// }

// const navigation: NavItem[] = [
//   { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
//   { name: "Hotels", href: "/admin/hotels", icon: Building2, badge: 12 },
//   {name: 'Terms', href:'/admin/terms', icon : Fingerprint },
//   {
//     name: "Subscriptions",
//     href: "/admin/subscriptions",
//     icon: CreditCard,
//     children: [
//       { name: "All Plans", href: "/admin/subscriptions", icon: CreditCard },
//       {
//         name: "Create Plan",
//         href: "/admin/subscriptions/create",
//         icon: CreditCard,
//       },
//       {
//         name: "Invoices",
//         href: "/admin/subscriptions/invoices",
//         icon: FileText,
//       },
//     ],
//   },
//   { name: "Settings", href: "/admin/settings", icon: Settings },
// ];

// const bottomNav: NavItem[] = [
//   { name: "Help", href: "/admin/help", icon: HelpCircle },
//   { name: "Security", href: "/admin/security", icon: Shield },
// ];

// export default function AdminSidebar({ isCollapsed, onToggle }: SidebarProps) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const dispatch = useDispatch<AppDispatch>();
//   const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   const toggleMenu = (name: string) => {
//     setExpandedMenus((prev) =>
//       prev.includes(name)
//         ? prev.filter((item) => item !== name)
//         : [...prev, name],
//     );
//   };

//   const handleLogout = async () => {
//     await dispatch(logoutAdmin());
//     router.push("/admin/login");
//   };

//   const isActive = (href: string) => {
//     if (href === "/admin/dashboard") {
//       return pathname === href;
//     }
//     return pathname.startsWith(href);
//   };

//   const renderNavItem = (item: NavItem, depth = 0) => {
//     const active = isActive(item.href);
//     const hasChildren = item.children && item.children.length > 0;
//     const isExpanded = expandedMenus.includes(item.name);

//     return (
//       <div key={item.name} className="relative">
//         {hasChildren ? (
//           <>
//             <button
//               onClick={() => toggleMenu(item.name)}
//               className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//                 active
//                   ? "bg-blue-50 text-blue-600"
//                   : "text-gray-700 hover:bg-gray-100"
//               } ${depth > 0 ? "ml-4" : ""}`}
//             >
//               <div className="flex items-center gap-3">
//                 <item.icon className="h-5 w-5" />
//                 {!isCollapsed && <span>{item.name}</span>}
//                 {item.badge && !isCollapsed && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </div>
//               {!isCollapsed && (
//                 <ChevronDown
//                   className={`h-4 w-4 transition-transform ${
//                     isExpanded ? "rotate-180" : ""
//                   }`}
//                 />
//               )}
//             </button>
//             {!isCollapsed && isExpanded && item.children && (
//               <div className="mt-1 space-y-1">
//                 {item.children.map((child) => renderNavItem(child, depth + 1))}
//               </div>
//             )}
//           </>
//         ) : (
//           <Link
//             href={item.href}
//             className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//               active
//                 ? "bg-blue-50 text-blue-600"
//                 : "text-gray-700 hover:bg-gray-100"
//             } ${depth > 0 ? "ml-4" : ""}`}
//           >
//             <item.icon className="h-5 w-5" />
//             {!isCollapsed && (
//               <>
//                 <span>{item.name}</span>
//                 {item.badge && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </>
//             )}
//           </Link>
//         )}
//       </div>
//     );
//   };

//   // Mobile menu (same as before)
//   if (isMobile) {
//     return (
//       <>
//         <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
//           <div className="flex items-center justify-between p-4">
//             <button
//               onClick={() => setShowMobileMenu(true)}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               <Menu className="h-6 w-6" />
//             </button>
//             <h1 className="text-lg font-bold text-blue-600">Admin Panel</h1>
//             <button className="p-2 hover:bg-gray-100 rounded-lg">
//               <Bell className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         {showMobileMenu && (
//           <div className="fixed inset-0 z-50 flex">
//             <div
//               className="fixed inset-0 bg-black bg-opacity-50"
//               onClick={() => setShowMobileMenu(false)}
//             />
//             <div className="relative w-64 bg-white h-full overflow-y-auto">
//               <div className="p-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-xl font-bold text-blue-600">Menu</h2>
//                   <button
//                     onClick={() => setShowMobileMenu(false)}
//                     className="p-2 hover:bg-gray-100 rounded-lg"
//                   >
//                     <ChevronLeft className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//               <nav className="p-4 space-y-1">
//                 {navigation.map((item) => renderNavItem(item))}
//                 <div className="border-t border-gray-200 my-4 pt-4">
//                   {bottomNav.map((item) => renderNavItem(item))}
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 >
//                   <LogOut className="h-5 w-5" />
//                   <span>Logout</span>
//                 </button>
//               </nav>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   }

//   // Desktop sidebar
//   return (
//     <div
//       className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
//         isCollapsed ? "w-20" : "w-64"
//       }`}
//     >
//       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
//         {!isCollapsed ? (
//           <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
//         ) : (
//           <h1 className="text-xl font-bold text-blue-600 mx-auto">A</h1>
//         )}
//         <button
//           onClick={onToggle}
//           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           {isCollapsed ? (
//             <ChevronRight className="h-5 w-5" />
//           ) : (
//             <ChevronLeft className="h-5 w-5" />
//           )}
//         </button>
//       </div>

//       {!isCollapsed && (
//         <div className="p-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       )}

//       <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
//         {navigation.map((item) => renderNavItem(item))}
//       </nav>

//       <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
//         <div className="space-y-1">
//           {bottomNav.map((item) => renderNavItem(item))}
//           <button
//             onClick={handleLogout}
//             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
//               isCollapsed ? "justify-center" : ""
//             }`}
//           >
//             <LogOut className="h-5 w-5" />
//             {!isCollapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// // }


// // components/admin/AdminSidebar.tsx
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import {
//   LayoutDashboard,
//   Building2,
//   CreditCard,
//   Users,
//   Settings,
//   LogOut,
//   ChevronLeft,
//   ChevronRight,
//   Menu,
//   Bell,
//   Search,
//   BarChart3,
//   FileText,
//   Shield,
//   HelpCircle,
//   ChevronDown,
//   Fingerprint,
//   Globe,
//   Lock,
//   AlertTriangle
// } from "lucide-react";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store";
// import { logoutAdmin } from "@/store/slices/authSlice";

// interface SidebarProps {
//   isCollapsed: boolean;
//   onToggle: () => void;
// }

// interface NavItem {
//   name: string;
//   href: string;
//   icon: React.ElementType;
//   badge?: number;
//   children?: NavItem[];
// }

// const navigation: NavItem[] = [
//   { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
//   { name: "Hotels", href: "/admin/hotels", icon: Building2, badge: 12 },
//   {
//     name: "Terms & Policies",
//     href: "/admin/terms",
//     icon: FileText,
//     children: [
//       { name: "Platform Terms", href: "/admin/terms?type=platform", icon: Globe },
//       { name: "Privacy Policy", href: "/admin/terms?type=privacy", icon: Shield },
//       { name: "Cancellation Policy", href: "/admin/terms?type=cancellation", icon: AlertTriangle },
//       { name: "All Terms", href: "/admin/terms", icon: FileText },
//     ],
//   },
//   {
//     name: "Subscriptions",
//     href: "/admin/subscriptions",
//     icon: CreditCard,
//     children: [
//       { name: "All Plans", href: "/admin/subscriptions", icon: CreditCard },
//       {
//         name: "Create Plan",
//         href: "/admin/subscriptions/create",
//         icon: CreditCard,
//       },
//       {
//         name: "Invoices",
//         href: "/admin/subscriptions/invoices",
//         icon: FileText,
//       },
//     ],
//   }];

// const bottomNav: NavItem[] = [
//     { name: "Settings", href: "/admin/settings", icon: Settings },

//   // { name: "Help", href: "/admin/help", icon: HelpCircle },
//   { name: "Security", href: "/admin/security", icon: Shield },
// ];

// export default function AdminSidebar({ isCollapsed, onToggle }: SidebarProps) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const dispatch = useDispatch<AppDispatch>();
//   const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   const toggleMenu = (name: string) => {
//     setExpandedMenus((prev) =>
//       prev.includes(name)
//         ? prev.filter((item) => item !== name)
//         : [...prev, name],
//     );
//   };

//   const handleLogout = async () => {
//     await dispatch(logoutAdmin());
//     router.push("/admin/login");
//   };

//   const isActive = (href: string) => {
//     if (href === "/admin/dashboard") {
//       return pathname === href;
//     }
//     // Handle query params for terms
//     if (href.includes("?")) {
//       const [basePath, query] = href.split("?");
//       if (pathname === basePath) {
//         const urlParams = new URLSearchParams(query);
//         const currentParams = new URLSearchParams(window.location.search);
//         return urlParams.get("type") === currentParams.get("type");
//       }
//     }
//     return pathname.startsWith(href);
//   };

//   const renderNavItem = (item: NavItem, depth = 0) => {
//     const active = isActive(item.href);
//     const hasChildren = item.children && item.children.length > 0;
//     const isExpanded = expandedMenus.includes(item.name);

//     return (
//       <div key={item.name} className="relative">
        
//         {hasChildren ? (
//           <>
//             <button
//               onClick={() => toggleMenu(item.name)}
//               className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//                 active
//                   ? "bg-blue-50 text-blue-600"
//                   : "text-gray-700 hover:bg-gray-100"
//               } ${depth > 0 ? "ml-4" : ""}`}
//             >
//               <div className="flex items-center gap-3">
//                 <item.icon className="h-5 w-5" />
//                 {!isCollapsed && <span>{item.name}</span>}
//                 {item.badge && !isCollapsed && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </div>
//               {!isCollapsed && (
//                 <ChevronDown
//                   className={`h-4 w-4 transition-transform ${
//                     isExpanded ? "rotate-180" : ""
//                   }`}
//                 />
//               )}
//             </button>
//             {!isCollapsed && isExpanded && item.children && (
//               <div className="mt-1 space-y-1">
//                 {item.children.map((child) => renderNavItem(child, depth + 1))}
//               </div>
//             )}
//           </>
//         ) : (
//           <Link
//             href={item.href}
//             className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
//               active
//                 ? "bg-blue-50 text-blue-600"
//                 : "text-gray-700 hover:bg-gray-100"
//             } ${depth > 0 ? "ml-4" : ""}`}
//           >
//             <item.icon className="h-5 w-5" />
//             {!isCollapsed && (
//               <>
//                 <span>{item.name}</span>
//                 {item.badge && (
//                   <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </>
//             )}
//           </Link>
//         )}
//       </div>
//     );
//   };

//   // Mobile menu
//   if (isMobile) {
//     return (
//       <>
//         <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
//           <div className="flex items-center justify-between p-4">
//             <button
//               onClick={() => setShowMobileMenu(true)}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               <Menu className="h-6 w-6" />
//             </button>
//             <h1 className="text-lg font-bold text-blue-600">Admin Panel</h1>
//             <button className="p-2 hover:bg-gray-100 rounded-lg">
//               <Bell className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         {showMobileMenu && (
//           <div className="fixed inset-0 z-50 flex">
//             <div
//               className="fixed inset-0 bg-black bg-opacity-50"
//               onClick={() => setShowMobileMenu(false)}
//             />
//             <div className="relative w-64 bg-white h-full overflow-y-auto">
//               <div className="p-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-xl font-bold text-blue-600">Menu</h2>
//                   <button
//                     onClick={() => setShowMobileMenu(false)}
//                     className="p-2 hover:bg-gray-100 rounded-lg"
//                   >
//                     <ChevronLeft className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//               <nav className="p-4 space-y-1">
//                 {navigation.map((item) => renderNavItem(item))}
//                 <div className="border-t border-gray-200 my-4 pt-4">
//                   {bottomNav.map((item) => renderNavItem(item))}
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 >
//                   <LogOut className="h-5 w-5" />
//                   <span>Logout</span>
//                 </button>
//               </nav>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   }

//   // Desktop sidebar
//   return (
//     <div
//       className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${
//         isCollapsed ? "w-20" : "w-64"
//       } flex flex-col`}
//     >
//       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
//         {!isCollapsed ? (
//           <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
//         ) : (
//           <h1 className="text-xl font-bold text-blue-600 mx-auto">A</h1>
//         )}
//         <button
//           onClick={onToggle}
//           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           {isCollapsed ? (
//             <ChevronRight className="h-5 w-5" />
//           ) : (
//             <ChevronLeft className="h-5 w-5" />
//           )}
//         </button>
//       </div>

//       {!isCollapsed && (
//         <div className="p-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>
//       )}

//       <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
//         {navigation.map((item) => renderNavItem(item))}
//       </nav>

//       <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
//         <div className="space-y-1">
//           {bottomNav.map((item) => renderNavItem(item))}
//           <button
//             onClick={handleLogout}
//             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
//               isCollapsed ? "justify-center" : ""
//             }`}
//           >
//             <LogOut className="h-5 w-5" />
//             {!isCollapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// components/admin/AdminSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
  FileText,
  Shield,
  ChevronDown,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { logoutAdmin } from "@/store/slices/authSlice";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Hotels", href: "/admin/hotels", icon: Building2, badge: 12 },
  {
    name: "Terms & Policies",
    href: "/admin/terms",
    icon: FileText,
    children: [
      { name: "Platform Terms", href: "/admin/terms?type=platform", icon: Globe },
      { name: "Privacy Policy", href: "/admin/terms?type=privacy", icon: Shield },
      { name: "Cancellation Policy", href: "/admin/terms?type=cancellation", icon: AlertTriangle },
      { name: "All Terms", href: "/admin/terms", icon: FileText },
    ],
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    children: [
      { name: "All Plans", href: "/admin/subscriptions", icon: CreditCard },
      { name: "Create Plan", href: "/admin/subscriptions/create", icon: CreditCard },
      { name: "Invoices", href: "/admin/subscriptions/invoices", icon: FileText },
    ],
  },
];

const bottomNav: NavItem[] = [
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Security", href: "/admin/security", icon: Shield },
];

export default function AdminSidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    router.push("/log/in");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    if (href.includes("?")) {
      const [basePath, query] = href.split("?");
      if (pathname === basePath) {
        const urlParams = new URLSearchParams(query);
        const currentParams = new URLSearchParams(window.location.search);
        return urlParams.get("type") === currentParams.get("type");
      }
    }

    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.name);

    return (
      <div key={item.name} className="relative">
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleMenu(item.name)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              } ${depth > 0 ? "ml-4" : ""} ${isCollapsed ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {!isCollapsed && isExpanded && item.children && (
              <div className="mt-1 space-y-1">
                {item.children.map((child) => renderNavItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              active
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            } ${depth > 0 ? "ml-4" : ""} ${isCollapsed ? "justify-center" : ""}`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-blue-600">Admin Panel</h1>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="relative w-64 bg-white h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-blue-600">Menu</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
                {navigation.map((item) => renderNavItem(item))}
                <div className="border-t border-gray-200 my-4 pt-4">
                  {bottomNav.map((item) => renderNavItem(item))}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } flex flex-col`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
        {!isCollapsed ? (
          <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
        ) : (
          <h1 className="text-xl font-bold text-blue-600 mx-auto">A</h1>
        )}

        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <nav className="space-y-1">
          {navigation.map((item) => renderNavItem(item))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white shrink-0">
        <div className="space-y-1">
          {bottomNav.map((item) => renderNavItem(item))}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}