// // components/dashboard/modals/InventoryModal.tsx
// 'use client'

// import React, { useState, useEffect } from 'react'
// import { X, Package, AlertCircle } from 'lucide-react'
// import { api } from '@/services/api'

// interface InventoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (inventoryData: any) => void
//   initialData?: any
//   hotelSlug: string
// }

// interface InventoryCategory {
//   id: string
//   name: string
// }

// export default function InventoryModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
//   hotelSlug
// }: InventoryModalProps) {
//   const [formData, setFormData] = useState({
//     item_name: '',
//     description: '',
//     category_id: '',
//     current_quantity: 0,
//     min_quantity: 10,
//     max_quantity: 0,
//     unit: 'pieces',
//     unit_cost: 0,
//     supplier_name: '',
//     supplier_contact: '',
//     supplier_price: 0,
//     location: '',
//     expiry_date: '',
//     is_active: true
//   })

//   const [categories, setCategories] = useState<InventoryCategory[]>([])
//   const [loading, setLoading] = useState(false)
//   const [units] = useState([
//     'pieces', 'kg', 'grams', 'liters', 'ml', 'packets', 'boxes', 'bottles'
//   ])

//   useEffect(() => {
//     const fetchCategories = async () => {
//       if (!isOpen || !hotelSlug) return

//       try {
//         const res = await api.get(`/api/hotel/${hotelSlug}/inventory/categories`)
//         setCategories(res.data || [])
//       } catch (error) {
//         console.error('Failed to fetch categories:', error)
//       }
//     }

//     fetchCategories()
//   }, [isOpen, hotelSlug])

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         item_name: initialData.item_name || '',
//         description: initialData.description || '',
//         category_id: initialData.category_id || '',
//         current_quantity: initialData.current_quantity || 0,
//         min_quantity: initialData.min_quantity || 10,
//         max_quantity: initialData.max_quantity || 0,
//         unit: initialData.unit || 'pieces',
//         unit_cost: initialData.unit_cost || 0,
//         supplier_name: initialData.supplier_name || '',
//         supplier_contact: initialData.supplier_contact || '',
//         supplier_price: initialData.supplier_price || 0,
//         location: initialData.location || '',
//         expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
//         is_active: initialData.is_active ?? true
//       })
//     } else {
//       setFormData({
//         item_name: '',
//         description: '',
//         category_id: '',
//         current_quantity: 0,
//         min_quantity: 10,
//         max_quantity: 0,
//         unit: 'pieces',
//         unit_cost: 0,
//         supplier_name: '',
//         supplier_contact: '',
//         supplier_price: 0,
//         location: '',
//         expiry_date: '',
//         is_active: true
//       })
//     }
//   }, [initialData])

//   if (!isOpen) return null

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     // Basic validation
//     if (!formData.item_name) {
//       alert('Please enter item name')
//       return
//     }

//     if (formData.current_quantity < 0) {
//       alert('Current quantity cannot be negative')
//       return
//     }

//     if (formData.min_quantity < 0) {
//       alert('Minimum quantity cannot be negative')
//       return
//     }

//     if (formData.max_quantity > 0 && formData.max_quantity < formData.min_quantity) {
//       alert('Maximum quantity must be greater than minimum quantity')
//       return
//     }

//     if (formData.unit_cost < 0) {
//       alert('Unit cost cannot be negative')
//       return
//     }

//     onSubmit(formData)
//   }

//   const calculateTotalValue = () => {
//     return formData.current_quantity * formData.unit_cost
//   }

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-50 rounded-lg">
//               <Package className="h-6 w-6 text-blue-600" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">
//                 {initialData ? 'Edit Inventory Item' : 'Add New Inventory Item'}
//               </h3>
//               <p className="text-sm text-gray-600 mt-1">
//                 {initialData ? 'Update inventory item details' : 'Add a new item to your inventory'}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="h-5 w-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Basic Information */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900">Basic Information</h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Item Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.item_name}
//                     onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     required
//                     placeholder="e.g., Chicken Breast"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Category
//                   </label>
//                   <select
//                     value={formData.category_id}
//                     onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="">Select Category</option>
//                     {categories.map(category => (
//                       <option key={category.id} value={category.id}>
//                         {category.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Description
//                   </label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     rows={2}
//                     placeholder="Item description..."
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Storage Location
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.location}
//                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g., Refrigerator A, Shelf 2"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Stock Details */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900">Stock Details</h4>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Current Quantity *
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.current_quantity}
//                     onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Unit *
//                   </label>
//                   <select
//                     value={formData.unit}
//                     onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     {units.map(unit => (
//                       <option key={unit} value={unit}>
//                         {unit.charAt(0).toUpperCase() + unit.slice(1)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Unit Cost *
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       $
//                     </span>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={formData.unit_cost}
//                       onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
//                       className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Minimum Quantity *
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.min_quantity}
//                     onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Maximum Quantity
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.max_quantity}
//                     onChange={(e) => setFormData({ ...formData, max_quantity: parseFloat(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Total Value
//                   </label>
//                   <p className="text-xl font-semibold text-gray-900">
//                     ${calculateTotalValue().toFixed(2)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Supplier Information */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900">Supplier Information</h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Name
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.supplier_name}
//                     onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Supplier company name"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Contact
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.supplier_contact}
//                     onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Phone or email"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Price
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       $
//                     </span>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={formData.supplier_price}
//                       onChange={(e) => setFormData({ ...formData, supplier_price: parseFloat(e.target.value) || 0 })}
//                       className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Expiry Date
//                   </label>
//                   <input
//                     type="date"
//                     value={formData.expiry_date}
//                     onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     min={new Date().toISOString().split('T')[0]}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Status */}
//             <div>
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={formData.is_active}
//                   onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                   className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
//                 />
//                 <span className="text-sm font-medium text-gray-700">Active</span>
//               </label>
//               <p className="text-sm text-gray-500 mt-1">
//                 Inactive items won't appear in inventory reports
//               </p>
//             </div>
//           </form>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               onClick={handleSubmit}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
//             >
//               {initialData ? 'Update Item' : 'Add Item'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // components/dashboard/modals/InventoryModal.tsx
// 'use client'

// import React, { useState, useEffect } from 'react'
// import { X, Package, AlertCircle, Loader2 } from 'lucide-react'
// import { hotelApi } from '@/services/hotelApi'

// interface InventoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (inventoryData: any) => void
//   initialData?: any
//   hotelSlug: string
// }

// interface InventoryCategory {
//   id: string
//   name: string
//   description?: string
// }

// interface FormErrors {
//   item_name?: string
//   current_quantity?: string
//   min_quantity?: string
//   max_quantity?: string
//   unit_cost?: string
//   unit?: string
//   expiry_date?: string
// }

// export default function InventoryModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
//   hotelSlug
// }: InventoryModalProps) {
//   const [formData, setFormData] = useState({
//     item_name: '',
//     description: '',
//     category_id: '',
//     current_quantity: 0,
//     min_quantity: 10,
//     max_quantity: 0,
//     unit: 'pieces',
//     unit_cost: 0,
//     supplier_name: '',
//     supplier_contact: '',
//     supplier_price: 0,
//     location: '',
//     expiry_date: '',
//     is_active: true
//   })

//   const [categories, setCategories] = useState<InventoryCategory[]>([])
//   const [loading, setLoading] = useState(false)
//   const [fetchingCategories, setFetchingCategories] = useState(false)
//   const [errors, setErrors] = useState<FormErrors>({})
//   const [touched, setTouched] = useState<Record<string, boolean>>({})

//   const units = [
//     { value: 'pieces', label: 'Pieces' },
//     { value: 'kg', label: 'Kilograms (kg)' },
//     { value: 'grams', label: 'Grams (g)' },
//     { value: 'liters', label: 'Liters (L)' },
//     { value: 'ml', label: 'Milliliters (ml)' },
//     { value: 'packets', label: 'Packets' },
//     { value: 'boxes', label: 'Boxes' },
//     { value: 'bottles', label: 'Bottles' },
//     { value: 'cans', label: 'Cans' },
//     { value: 'bags', label: 'Bags' }
//   ]

//   // Fetch categories when modal opens
//   useEffect(() => {
//     // const fetchCategories = async () => {
//     //   if (!isOpen || !hotelSlug) return

//     //   setFetchingCategories(true)
//     //   try {
//     //     const response = await hotelApi.get(`/api/hotel/data/inventory/categories`)
//     //     // Handle different response structures
//     //     const categoriesData = response?.data?.categories || response?.data?.data || response?.data || []
//     //     setCategories(Array.isArray(categoriesData) ? categoriesData : [])
//     //   } catch (error) {
//     //     console.error('Failed to fetch categories:', error)
//     //     setCategories([])
//     //   } finally {
//     //     setFetchingCategories(false)
//     //   }
//     // }
//     // In your InventoryModal component, update the API call:
// const fetchCategories = async () => {
//   if (!isOpen || !hotelSlug) return

//   setFetchingCategories(true)
//   try {
//     // Make sure this matches your route structure
//     const response = await hotelApi.get(`/api/hotel/${hotelSlug}/inventory/categories`)
//     // Or if you're using the hotelApi instance that already includes /api/hotel
//     // const response = await hotelApi.get(`/inventory/categories`)

//     const categoriesData = response?.data?.categories || response?.data?.data || response?.data || []
//     setCategories(Array.isArray(categoriesData) ? categoriesData : [])
//   } catch (error) {
//     console.error('Failed to fetch categories:', error)
//     setCategories([])
//   } finally {
//     setFetchingCategories(false)
//   }
// }

//     fetchCategories()
//   }, [isOpen, hotelSlug])

//   // Reset form when modal opens/closes or initialData changes
//   useEffect(() => {
//     if (isOpen) {
//       if (initialData) {
//         setFormData({
//           item_name: initialData.item_name || initialData.name || '',
//           description: initialData.description || '',
//           category_id: initialData.category_id || '',
//           current_quantity: initialData.current_quantity || 0,
//           min_quantity: initialData.min_quantity || 10,
//           max_quantity: initialData.max_quantity || 0,
//           unit: initialData.unit || 'pieces',
//           unit_cost: initialData.unit_cost || 0,
//           supplier_name: initialData.supplier_name || '',
//           supplier_contact: initialData.supplier_contact || '',
//           supplier_price: initialData.supplier_price || 0,
//           location: initialData.location || '',
//           expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
//           is_active: initialData.is_active ?? true
//         })
//       } else {
//         setFormData({
//           item_name: '',
//           description: '',
//           category_id: '',
//           current_quantity: 0,
//           min_quantity: 10,
//           max_quantity: 0,
//           unit: 'pieces',
//           unit_cost: 0,
//           supplier_name: '',
//           supplier_contact: '',
//           supplier_price: 0,
//           location: '',
//           expiry_date: '',
//           is_active: true
//         })
//       }
//       setErrors({})
//       setTouched({})
//     }
//   }, [isOpen, initialData])

//   // Validation function
//   const validateForm = (): boolean => {
//     const newErrors: FormErrors = {}

//     // Required fields
//     if (!formData.item_name.trim()) {
//       newErrors.item_name = 'Item name is required'
//     } else if (formData.item_name.length < 2) {
//       newErrors.item_name = 'Item name must be at least 2 characters'
//     } else if (formData.item_name.length > 100) {
//       newErrors.item_name = 'Item name must be less than 100 characters'
//     }

//     if (!formData.unit) {
//       newErrors.unit = 'Unit is required'
//     }

//     // Quantity validations
//     if (formData.current_quantity < 0) {
//       newErrors.current_quantity = 'Current quantity cannot be negative'
//     }

//     if (formData.min_quantity < 0) {
//       newErrors.min_quantity = 'Minimum quantity cannot be negative'
//     }

//     if (formData.max_quantity > 0 && formData.max_quantity < formData.min_quantity) {
//       newErrors.max_quantity = 'Maximum quantity must be greater than minimum quantity'
//     }

//     // Cost validation
//     if (formData.unit_cost < 0) {
//       newErrors.unit_cost = 'Unit cost cannot be negative'
//     }

//     // Date validation
//     if (formData.expiry_date) {
//       const expiryDate = new Date(formData.expiry_date)
//       const today = new Date()
//       today.setHours(0, 0, 0, 0)

//       if (expiryDate < today) {
//         newErrors.expiry_date = 'Expiry date cannot be in the past'
//       }
//     }

//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleFieldChange = (field: string, value: any) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//     // Clear error for this field when user starts typing
//     if (errors[field as keyof FormErrors]) {
//       setErrors(prev => ({ ...prev, [field]: undefined }))
//     }
//   }

//   const handleBlur = (field: string) => {
//     setTouched(prev => ({ ...prev, [field]: true }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     // Mark all fields as touched for validation
//     const allFields = ['item_name', 'unit', 'current_quantity', 'min_quantity', 'unit_cost']
//     const touchedFields = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
//     setTouched(touchedFields)

//     // Validate form
//     if (!validateForm()) {
//       return
//     }

//     setLoading(true)
//     try {
//       // Prepare data for submission
//       const submitData = {
//         item_name: formData.item_name,
//         description: formData.description || null,
//         category_id: formData.category_id || null,
//         current_quantity: formData.current_quantity,
//         min_quantity: formData.min_quantity,
//         max_quantity: formData.max_quantity || null,
//         unit: formData.unit,
//         unit_cost: formData.unit_cost,
//         supplier_name: formData.supplier_name || null,
//         supplier_contact: formData.supplier_contact || null,
//         supplier_price: formData.supplier_price || null,
//         location: formData.location || null,
//         expiry_date: formData.expiry_date || null,
//         is_active: formData.is_active
//       }

//       await onSubmit(submitData)
//       onClose()
//     } catch (error) {
//       console.error('Failed to submit inventory item:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const calculateTotalValue = () => {
//     return (formData.current_quantity * formData.unit_cost).toFixed(2)
//   }

//   const getStockStatus = () => {
//     if (formData.current_quantity <= 0) return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' }
//     if (formData.current_quantity <= formData.min_quantity) return { label: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-50' }
//     if (formData.max_quantity > 0 && formData.current_quantity >= formData.max_quantity) return { label: 'Over Stock', color: 'text-orange-600', bg: 'bg-orange-50' }
//     return { label: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' }
//   }

//   if (!isOpen) return null

//   const stockStatus = getStockStatus()

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-50 rounded-lg">
//               <Package className="h-6 w-6 text-blue-600" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">
//                 {initialData ? 'Edit Inventory Item' : 'Add New Inventory Item'}
//               </h3>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 {initialData ? 'Update inventory item details' : 'Add a new item to your inventory'}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//             disabled={loading}
//           >
//             <X className="h-5 w-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Basic Information */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900 flex items-center gap-2">
//                 Basic Information
//                 <span className="text-xs text-gray-500 font-normal">* Required fields</span>
//               </h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Item Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.item_name}
//                     onChange={(e) => handleFieldChange('item_name', e.target.value)}
//                     onBlur={() => handleBlur('item_name')}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
//                       ${touched.item_name && errors.item_name ? 'border-red-500' : 'border-gray-300'}`}
//                     placeholder="e.g., Chicken Breast, Tomato Sauce, Rice"
//                     disabled={loading}
//                   />
//                   {touched.item_name && errors.item_name && (
//                     <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
//                       <AlertCircle className="h-3 w-3" />
//                       {errors.item_name}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Category
//                   </label>
//                   <select
//                     value={formData.category_id}
//                     onChange={(e) => handleFieldChange('category_id', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     disabled={loading || fetchingCategories}
//                   >
//                     <option value="">Select Category</option>
//                     {categories.map(category => (
//                       <option key={category.id} value={category.id}>
//                         {category.name}
//                       </option>
//                     ))}
//                   </select>
//                   {fetchingCategories && (
//                     <p className="mt-1 text-sm text-gray-500">Loading categories...</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Storage Location
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.location}
//                     onChange={(e) => handleFieldChange('location', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g., Refrigerator A, Shelf 2, Warehouse B"
//                     disabled={loading}
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Description
//                   </label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => handleFieldChange('description', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     rows={2}
//                     placeholder="Item description, specifications, or notes..."
//                     disabled={loading}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Stock Details */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900">Stock Details</h4>

//               {/* Stock Status Banner */}
//               <div className={`p-3 rounded-lg ${stockStatus.bg}`}>
//                 <div className="flex items-center justify-between">
//                   <span className={`text-sm font-medium ${stockStatus.color}`}>
//                     Stock Status: {stockStatus.label}
//                   </span>
//                   <span className="text-sm text-gray-600">
//                     Total Value: ${calculateTotalValue()}
//                   </span>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Current Quantity *
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.current_quantity}
//                     onChange={(e) => handleFieldChange('current_quantity', parseFloat(e.target.value) || 0)}
//                     onBlur={() => handleBlur('current_quantity')}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                       ${touched.current_quantity && errors.current_quantity ? 'border-red-500' : 'border-gray-300'}`}
//                     disabled={loading}
//                   />
//                   {touched.current_quantity && errors.current_quantity && (
//                     <p className="mt-1 text-sm text-red-600">{errors.current_quantity}</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Unit *
//                   </label>
//                   <select
//                     value={formData.unit}
//                     onChange={(e) => handleFieldChange('unit', e.target.value)}
//                     onBlur={() => handleBlur('unit')}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                       ${touched.unit && errors.unit ? 'border-red-500' : 'border-gray-300'}`}
//                     disabled={loading}
//                   >
//                     {units.map(unit => (
//                       <option key={unit.value} value={unit.value}>
//                         {unit.label}
//                       </option>
//                     ))}
//                   </select>
//                   {touched.unit && errors.unit && (
//                     <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Unit Cost *
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       $
//                     </span>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={formData.unit_cost}
//                       onChange={(e) => handleFieldChange('unit_cost', parseFloat(e.target.value) || 0)}
//                       onBlur={() => handleBlur('unit_cost')}
//                       className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                         ${touched.unit_cost && errors.unit_cost ? 'border-red-500' : 'border-gray-300'}`}
//                       disabled={loading}
//                     />
//                   </div>
//                   {touched.unit_cost && errors.unit_cost && (
//                     <p className="mt-1 text-sm text-red-600">{errors.unit_cost}</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Minimum Quantity *
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.min_quantity}
//                     onChange={(e) => handleFieldChange('min_quantity', parseFloat(e.target.value) || 0)}
//                     onBlur={() => handleBlur('min_quantity')}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                       ${touched.min_quantity && errors.min_quantity ? 'border-red-500' : 'border-gray-300'}`}
//                     disabled={loading}
//                   />
//                   {touched.min_quantity && errors.min_quantity && (
//                     <p className="mt-1 text-sm text-red-600">{errors.min_quantity}</p>
//                   )}
//                   <p className="mt-1 text-xs text-gray-500">
//                     Alert when stock falls below this level
//                   </p>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Maximum Quantity
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.001"
//                     value={formData.max_quantity}
//                     onChange={(e) => handleFieldChange('max_quantity', parseFloat(e.target.value) || 0)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     disabled={loading}
//                   />
//                   {errors.max_quantity && (
//                     <p className="mt-1 text-sm text-red-600">{errors.max_quantity}</p>
//                   )}
//                   <p className="mt-1 text-xs text-gray-500">
//                     Optional: Alert when stock exceeds this level
//                   </p>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Expiry Date
//                   </label>
//                   <input
//                     type="date"
//                     value={formData.expiry_date}
//                     onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
//                     onBlur={() => handleBlur('expiry_date')}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                       ${touched.expiry_date && errors.expiry_date ? 'border-red-500' : 'border-gray-300'}`}
//                     min={new Date().toISOString().split('T')[0]}
//                     disabled={loading}
//                   />
//                   {touched.expiry_date && errors.expiry_date && (
//                     <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Supplier Information */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-gray-900">Supplier Information</h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Name
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.supplier_name}
//                     onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Supplier company name"
//                     disabled={loading}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Contact
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.supplier_contact}
//                     onChange={(e) => handleFieldChange('supplier_contact', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Phone number or email"
//                     disabled={loading}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Supplier Price
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       $
//                     </span>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={formData.supplier_price}
//                       onChange={(e) => handleFieldChange('supplier_price', parseFloat(e.target.value) || 0)}
//                       className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       disabled={loading}
//                     />
//                   </div>
//                   <p className="mt-1 text-xs text-gray-500">
//                     Purchase price from supplier (if different from unit cost)
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Status */}
//             <div className="space-y-2">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={formData.is_active}
//                   onChange={(e) => handleFieldChange('is_active', e.target.checked)}
//                   className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
//                   disabled={loading}
//                 />
//                 <span className="text-sm font-medium text-gray-700">Active</span>
//               </label>
//               <p className="text-sm text-gray-500 ml-6">
//                 Inactive items won't appear in inventory reports and can't be used in orders
//               </p>
//             </div>
//           </form>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               onClick={handleSubmit}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//               disabled={loading}
//             >
//               {loading && <Loader2 className="h-4 w-4 animate-spin" />}
//               {initialData ? 'Update Item' : 'Add Item'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Package, AlertCircle, Loader2 } from "lucide-react";
import { hotelApi } from "@/services/hotelApi";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inventoryData: any) => void;
  initialData?: any;
  hotelSlug: string;
}

interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
}

interface FormErrors {
  item_name?: string;
  current_quantity?: string;
  min_quantity?: string;
  max_quantity?: string;
  unit_cost?: string;
  unit?: string;
  expiry_date?: string;
}

const DEFAULT_FORM = {
  item_name: "",
  description: "",
  category_id: "",
  current_quantity: 0,
  min_quantity: 10,
  max_quantity: 0,
  unit: "pieces",
  unit_cost: 0,
  supplier_name: "",
  supplier_contact: "",
  supplier_price: 0,
  location: "",
  expiry_date: "",
  is_active: true,
};

const UNITS = [
  { value: "pieces", label: "Pieces" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "grams", label: "Grams (g)" },
  { value: "liters", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "packets", label: "Packets" },
  { value: "boxes", label: "Boxes" },
  { value: "bottles", label: "Bottles" },
  { value: "cans", label: "Cans" },
  { value: "bags", label: "Bags" },
];

export default function InventoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: InventoryModalProps) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Track mounted state to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch inventory categories — correct endpoint matches dashboardRoutes
  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const response = await hotelApi.get(
          `/api/hotel/data/inventory/categories`,
        );
        const raw = response?.data;
        const data =
          raw?.categories ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        if (mountedRef.current) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch inventory categories:", error);
        if (mountedRef.current) setCategories([]);
      } finally {
        if (mountedRef.current) setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  // Populate / reset form whenever modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        item_name: initialData.item_name || initialData.name || "",
        description: initialData.description || "",
        category_id: initialData.category_id || "",
        current_quantity: initialData.current_quantity ?? 0,
        min_quantity: initialData.min_quantity ?? 10,
        max_quantity: initialData.max_quantity ?? 0,
        unit: initialData.unit || "pieces",
        unit_cost: initialData.unit_cost ?? 0,
        supplier_name: initialData.supplier_name || "",
        supplier_contact: initialData.supplier_contact || "",
        supplier_price: initialData.supplier_price ?? 0,
        location: initialData.location || "",
        expiry_date: initialData.expiry_date
          ? initialData.expiry_date.split("T")[0]
          : "",
        is_active: initialData.is_active ?? true,
      });
    } else {
      setFormData(DEFAULT_FORM);
    }

    setErrors({});
    setTouched({});
  }, [isOpen, initialData]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    } else if (formData.item_name.length < 2) {
      newErrors.item_name = "Item name must be at least 2 characters";
    } else if (formData.item_name.length > 100) {
      newErrors.item_name = "Item name must be less than 100 characters";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    if (formData.current_quantity < 0) {
      newErrors.current_quantity = "Current quantity cannot be negative";
    }

    if (formData.min_quantity < 0) {
      newErrors.min_quantity = "Minimum quantity cannot be negative";
    }

    if (
      formData.max_quantity > 0 &&
      formData.max_quantity < formData.min_quantity
    ) {
      newErrors.max_quantity =
        "Maximum quantity must be greater than minimum quantity";
    }

    if (formData.unit_cost < 0) {
      newErrors.unit_cost = "Unit cost cannot be negative";
    }

    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        newErrors.expiry_date = "Expiry date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Single submission handler — attached only to <form onSubmit>
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark required fields as touched so errors appear
    setTouched({
      item_name: true,
      unit: true,
      current_quantity: true,
      min_quantity: true,
      unit_cost: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        item_name: formData.item_name.trim(),
        description: formData.description || null,
        category_id: formData.category_id || null,
        current_quantity: formData.current_quantity,
        min_quantity: formData.min_quantity,
        max_quantity: formData.max_quantity || null,
        unit: formData.unit,
        unit_cost: formData.unit_cost,
        supplier_name: formData.supplier_name || null,
        supplier_contact: formData.supplier_contact || null,
        supplier_price: formData.supplier_price || null,
        location: formData.location || null,
        expiry_date: formData.expiry_date
          ? new Date(`${formData.expiry_date}T00:00:00`).toISOString()
          : null,
        is_active: formData.is_active,
      };

      await onSubmit(submitData);
      // Only close after successful submission; onSubmit should throw on error
      onClose();
    } catch (error) {
      console.error("Failed to submit inventory item:", error);
      // Keep modal open so the user can correct and retry
    } finally {
      // Guard against setState on unmounted component
      if (mountedRef.current) setLoading(false);
    }
  };

  // ── Derived UI helpers ────────────────────────────────────────────────────

  const totalValue = (formData.current_quantity * formData.unit_cost).toFixed(
    2,
  );

  const stockStatus = (() => {
    if (formData.current_quantity <= 0)
      return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    if (formData.current_quantity <= formData.min_quantity)
      return {
        label: "Low Stock",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    if (
      formData.max_quantity > 0 &&
      formData.current_quantity >= formData.max_quantity
    )
      return {
        label: "Over Stock",
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    return { label: "In Stock", color: "text-green-600", bg: "bg-green-50" };
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {initialData ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {initialData
                  ? "Update inventory item details"
                  : "Add a new item to your inventory"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/*
            The <form> wraps both the scrollable fields AND the footer submit
            button via the `form` attribute trick — this keeps the DOM valid
            (no button outside its form) while preserving the scrollable layout.
          */}
          <form
            id="inventory-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            {/* Basic Information */}
            <section className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                Basic Information
                <span className="text-xs text-gray-500 font-normal">
                  * Required fields
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) =>
                      handleFieldChange("item_name", e.target.value)
                    }
                    onBlur={() => handleBlur("item_name")}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                      ${touched.item_name && errors.item_name ? "border-red-500" : "border-gray-300"}`}
                    placeholder="e.g., Chicken Breast, Tomato Sauce, Rice"
                    disabled={loading}
                  />
                  {touched.item_name && errors.item_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.item_name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      handleFieldChange("category_id", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || fetchingCategories}
                  >
                    <option value="">
                      {fetchingCategories
                        ? "Loading categories…"
                        : "Select Category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleFieldChange("location", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Refrigerator A, Shelf 2, Warehouse B"
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Item description, specifications, or notes…"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            {/* Stock Details */}
            <section className="space-y-4">
              <h4 className="font-medium text-gray-900">Stock Details</h4>

              {/* Stock status banner */}
              <div className={`p-3 rounded-lg ${stockStatus.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    Stock Status: {stockStatus.label}
                  </span>
                  <span className="text-sm text-gray-600">
                    Total Value: ₹{totalValue}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Current Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.current_quantity}
                    onChange={(e) =>
                      handleFieldChange(
                        "current_quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    onBlur={() => handleBlur("current_quantity")}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${touched.current_quantity && errors.current_quantity ? "border-red-500" : "border-gray-300"}`}
                    disabled={loading}
                  />
                  {touched.current_quantity && errors.current_quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.current_quantity}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleFieldChange("unit", e.target.value)}
                    onBlur={() => handleBlur("unit")}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${touched.unit && errors.unit ? "border-red-500" : "border-gray-300"}`}
                    disabled={loading}
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  {touched.unit && errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
                  )}
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.unit_cost}
                      onChange={(e) =>
                        handleFieldChange(
                          "unit_cost",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      onBlur={() => handleBlur("unit_cost")}
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${touched.unit_cost && errors.unit_cost ? "border-red-500" : "border-gray-300"}`}
                      disabled={loading}
                    />
                  </div>
                  {touched.unit_cost && errors.unit_cost && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.unit_cost}
                    </p>
                  )}
                </div>

                {/* Min Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.min_quantity}
                    onChange={(e) =>
                      handleFieldChange(
                        "min_quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    onBlur={() => handleBlur("min_quantity")}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${touched.min_quantity && errors.min_quantity ? "border-red-500" : "border-gray-300"}`}
                    disabled={loading}
                  />
                  {touched.min_quantity && errors.min_quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.min_quantity}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Alert when stock falls below this level
                  </p>
                </div>

                {/* Max Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.max_quantity}
                    onChange={(e) =>
                      handleFieldChange(
                        "max_quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.max_quantity ? "border-red-500" : "border-gray-300"}`}
                    disabled={loading}
                  />
                  {errors.max_quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.max_quantity}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: alert when stock exceeds this level
                  </p>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      handleFieldChange("expiry_date", e.target.value)
                    }
                    onBlur={() => handleBlur("expiry_date")}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${touched.expiry_date && errors.expiry_date ? "border-red-500" : "border-gray-300"}`}
                    disabled={loading}
                  />
                  {touched.expiry_date && errors.expiry_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.expiry_date}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Supplier Information */}
            <section className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Supplier Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) =>
                      handleFieldChange("supplier_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supplier company name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_contact}
                    onChange={(e) =>
                      handleFieldChange("supplier_contact", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number or email"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      // min="0"
                      value={formData.supplier_price}
                      onChange={(e) =>
                        handleFieldChange(
                          "supplier_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Purchase price from supplier (if different from unit cost)
                  </p>
                </div>
              </div>
            </section>

            {/* Status */}
            <section className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleFieldChange("is_active", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
              <p className="text-sm text-gray-500 ml-6">
                Inactive items won't appear in inventory reports and can't be
                used in orders
              </p>
            </section>
          </form>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          {/*
            form="inventory-form" links this button to the <form> above
            even though it sits outside of it in the DOM tree.
          */}
          <button
            type="submit"
            form="inventory-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {initialData ? "Update Item" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
