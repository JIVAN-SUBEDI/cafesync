

'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Search, IndianRupee, Minus, ShoppingCart, Check } from 'lucide-react'
import { hotelApi } from '@/services/hotelApi'
import toast from 'react-hot-toast'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (orderData: any) => void
  initialData?: any
  hotelSlug: string
}

interface Table {
  id: string
  table_number: string
  table_name?: string
  capacity: number
  status: string
}

interface Staff {
  id: string
  staff_code: string
  full_name: string
  name?: string
  role: string
}

interface MenuItem {
  id: string
  item_code: string
  name: string
  description?: string
  price: number
  category_name?: string
  category_id?: string
  is_available: boolean
  image_url?: string | null
  is_vegetarian?: boolean
  preparation_time?: number | null
}

interface OrderItem {
  menu_item_id: string
  currencySymbol: string
  quantity: number
  special_instructions?: string
  menu_item?: MenuItem
}

export default function OrderModal({ isOpen, onClose, onSubmit, initialData, hotelSlug,currencySymbol }: OrderModalProps) {
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    waiter_id: '',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'cash',
    special_instructions: '',
    kitchen_notes: '',
    discount_amount: 0,
    items: [] as OrderItem[]
  })

  const [tables, setTables] = useState<Table[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedWaiter, setSelectedWaiter] = useState<Staff | null>(null)
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map())
  const [phoneError, setPhoneError] = useState<string>('')

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id)
      return sum + (menuItem?.price || 0) * item.quantity
    }, 0)

    const taxRate = 0.10 // 10% tax
    const serviceChargeRate = 0.05 // 5% service charge
    
    const taxAmount = subtotal * taxRate
    const serviceCharge = subtotal * serviceChargeRate
    const discount = formData.discount_amount || 0
    
    return {
      subtotal,
      tax_amount: taxAmount,
      service_charge: serviceCharge,
      discount_amount: discount,
      total_amount: subtotal + taxAmount + serviceCharge - discount
    }
  }

  const totals = calculateTotals()

  const getTableStatusColor = (status: string) => {
    switch(status) {
      case 'available': return 'text-green-600'
      case 'occupied': return 'text-red-600'
      case 'reserved': return 'text-amber-600'
      case 'cleaning': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^\d{10}$/ // Exactly 10 digits
    if (!phoneRegex.test(phone)) {
      setPhoneError('Phone number must be exactly 10 digits')
      return false
    }
    setPhoneError('')
    return true
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '')
    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10)
    setFormData({ ...formData, customer_phone: limitedDigits })
    validatePhoneNumber(limitedDigits)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !hotelSlug) return

      try {
        setLoading(true)
        
        const tablesRes = await hotelApi.get(`/api/hotel/data/tables`)
        const tablesData = tablesRes?.data?.tables || tablesRes?.data?.data || tablesRes?.data || []
        setTables(Array.isArray(tablesData) ? tablesData : [])
        
        // Verify selected table is still valid for editing
        if (initialData && initialData.table_id && Array.isArray(tablesData)) {
          const currentTable = tablesData.find((t: any) => t.id === initialData.table_id)
          if (currentTable && currentTable.status !== 'available' && currentTable.status !== 'occupied') {
            toast.error(`Table ${currentTable.table_number} is now ${currentTable.status}. The order may need attention.`)
          }
        }
        
        const staffRes = await hotelApi.get(`/api/hotel/data/staff`)
        const staffData = staffRes?.data?.staff || staffRes?.data?.data || staffRes?.data || []
        const allStaff = Array.isArray(staffData) ? staffData : []
        const waiters = allStaff.filter((s: any) => s.role === 'waiter').map((s: any) => ({
          id: s.id,
          staff_code: s.staff_code,
          full_name: s.full_name || s.name || '',
          name: s.full_name || s.name || '',
          role: s.role
        }))
        setStaff(waiters)
        
        const menuRes = await hotelApi.get(`/api/hotel/data/menu/items`)
        const menuData = menuRes?.data?.items || menuRes?.data?.data || menuRes?.data || []
        const availableItems = Array.isArray(menuData) 
          ? menuData.filter((item: any) => item.is_available !== false)
          : []
        setMenuItems(availableItems)
        
        const uniqueCategories = Array.from(new Set(availableItems.map((item: any) => item.category_name || 'Uncategorized')))
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, hotelSlug, initialData])

  useEffect(() => {
    if (initialData && tables.length > 0 && staff.length > 0) {
      const itemsWithMenuItems = initialData.items?.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions || '',
        menu_item: menuItems.find(m => m.id === item.menu_item_id)
      })) || []

      setFormData({
        table_id: initialData.table_id || '',
        customer_name: initialData.customer_name || '',
        customer_phone: initialData.customer_phone || '',
        waiter_id: initialData.waiter_id || '',
        status: initialData.status || 'pending',
        payment_status: initialData.payment_status || 'pending',
        payment_method: initialData.payment_method || 'cash',
        special_instructions: initialData.special_instructions || '',
        kitchen_notes: initialData.kitchen_notes || '',
        discount_amount: initialData.discount_amount || 0,
        items: itemsWithMenuItems
      })

      if (initialData.table_id) {
        const table = tables.find(t => t.id === initialData.table_id)
        setSelectedTable(table || null)
      }
      if (initialData.waiter_id) {
        const waiter = staff.find(s => s.id === initialData.waiter_id)
        setSelectedWaiter(waiter || null)
      }
      
      // Validate phone number if present
      if (initialData.customer_phone) {
        validatePhoneNumber(initialData.customer_phone)
      }
    } else if (!initialData) {
      setFormData({
        table_id: '',
        customer_name: '',
        customer_phone: '',
        waiter_id: '',
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'cash',
        special_instructions: '',
        kitchen_notes: '',
        discount_amount: 0,
        items: []
      })
      setSelectedTable(null)
      setSelectedWaiter(null)
      setPhoneError('')
    }
  }, [initialData, tables, staff, menuItems])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.table_id) {
      toast.error('Please select a table')
      return
    }

    // Check if the selected table is available (for new orders)
    if (!initialData) {
      const selectedTable = tables.find(t => t.id === formData.table_id)
      if (selectedTable && selectedTable.status !== 'available') {
        toast.error(`Table ${selectedTable.table_number} is currently ${selectedTable.status}. Please select another table.`)
        return
      }
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one menu item')
      return
    }

    // Validate phone number if provided
    if (formData.customer_phone && !validatePhoneNumber(formData.customer_phone)) {
      toast.error(phoneError || 'Please enter a valid 10-digit phone number')
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        ...formData,
        ...totals,
        items: formData.items.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || ''
        }))
      }
      
      await onSubmit(orderData)
    } catch (error: any) {
      console.error('Failed to submit order:', error)
      
      // Handle validation errors from backend
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors
        errors.forEach((err: any) => {
          if (err.field === 'customer_phone') {
            toast.error(err.message)
          } else {
            toast.error(`${err.field}: ${err.message}`)
          }
        })
      } else {
        toast.error(error?.message || 'Failed to submit order')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const addMultipleItems = () => {
    const itemsToAdd: OrderItem[] = []
    
    selectedItems.forEach(itemId => {
      const quantity = itemQuantities.get(itemId) || 1
      const menuItem = menuItems.find(m => m.id === itemId)
      
      if (menuItem) {
        const existingItem = formData.items.find(item => item.menu_item_id === itemId)
        
        if (existingItem) {
          // Update existing item quantity
          existingItem.quantity += quantity
        } else {
          // Add new item
          itemsToAdd.push({
            menu_item_id: itemId,
            quantity: quantity,
            special_instructions: '',
            menu_item: menuItem
          })
        }
      }
    })
    
    if (itemsToAdd.length > 0 || selectedItems.size > 0) {
      const updatedItems = [...formData.items]
      
      // Add new items
      updatedItems.push(...itemsToAdd)
      
      // Update existing items that were modified
      formData.items.forEach(item => {
        if (selectedItems.has(item.menu_item_id)) {
          const newQuantity = itemQuantities.get(item.menu_item_id)
          if (newQuantity) {
            item.quantity = newQuantity
          }
        }
      })
      
      setFormData({ ...formData, items: updatedItems })
      toast.success(`Added ${itemsToAdd.length} item(s) to order`)
    }
    
    // Reset selection
    setSelectedItems(new Set())
    setItemQuantities(new Map())
    setShowItemSelector(false)
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
      const newQuantities = new Map(itemQuantities)
      newQuantities.delete(itemId)
      setItemQuantities(newQuantities)
    } else {
      newSelected.add(itemId)
      setItemQuantities(new Map(itemQuantities).set(itemId, 1))
    }
    setSelectedItems(newSelected)
  }

  const updateSelectedQuantity = (itemId: string, delta: number) => {
    const currentQty = itemQuantities.get(itemId) || 1
    const newQty = Math.max(1, currentQty + delta)
    setItemQuantities(new Map(itemQuantities).set(itemId, newQty))
  }

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...formData.items]
    const newQuantity = Math.max(1, (newItems[index].quantity || 1) + delta)
    newItems[index].quantity = newQuantity
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    const itemName = formData.items[index].menu_item?.name || 'Item'
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
    toast.success(`${itemName} removed from order`)
  }

  const updateSpecialInstructions = (index: number, instructions: string) => {
    const newItems = [...formData.items]
    newItems[index].special_instructions = instructions
    setFormData({ ...formData, items: newItems })
  }

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.item_code && item.item_code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toFixed(2)}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Edit Order' : 'Create New Order'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {initialData ? `Order #${initialData.order_number || ''}` : 'Create a new order for your hotel'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer & Table Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table *
                    </label>
                    <select
                      value={formData.table_id}
                      onChange={(e) => {
                        const tableId = e.target.value
                        const table = tables.find(t => t.id === tableId)
                        setFormData({ ...formData, table_id: tableId })
                        setSelectedTable(table || null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a table</option>
                      {tables
                        .filter(table => {
                          // For editing an existing order: show the current table even if occupied
                          if (initialData && table.id === formData.table_id) {
                            return true
                          }
                          // For new orders or other tables: only show available tables
                          return table.status === 'available'
                        })
                        .map(table => (
                          <option key={table.id} value={table.id}>
                            {table.table_name || `Table ${table.table_number}`} 
                            {table.capacity ? ` (${table.capacity} seats)` : ''}
                            {table.status !== 'available' ? ` - ${table.status}` : ''}
                          </option>
                        ))}
                    </select>
                    {selectedTable && selectedTable.status !== 'available' && initialData && (
                      <p className="mt-1 text-xs text-amber-600">
                        Note: This table is currently {selectedTable.status}. The order will still be updated.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waiter
                    </label>
                    <select
                      value={formData.waiter_id}
                      onChange={(e) => {
                        const waiterId = e.target.value
                        const waiter = staff.find(s => s.id === waiterId)
                        setFormData({ ...formData, waiter_id: waiterId })
                        setSelectedWaiter(waiter || null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select waiter</option>
                      {staff.map(waiter => (
                        <option key={waiter.id} value={waiter.id}>
                          {waiter.full_name || waiter.name} ({waiter.staff_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Walk-in customer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        phoneError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="98XXXXXXXX"
                      maxLength={10}
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter exactly 10 digits (e.g., 9812345678)</p>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Order Items</h4>
                    <span className="text-sm text-gray-500">
                      ({formData.items.length} item{formData.items.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowItemSelector(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Items
                  </button>
                </div>

                {/* Current Order Items List */}
                <div className="p-4 max-h-80 overflow-y-auto">
                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No items added yet</p>
                      <button
                        onClick={() => setShowItemSelector(true)}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Click here to add items
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.items.map((item, index) => {
                        const menuItem = item.menu_item || menuItems.find(m => m.id === item.menu_item_id)
                        if (!menuItem) return null
                        
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            {/* Item Image */}
                            {menuItem.image_url && (
                              <img
                                src={menuItem.image_url}
                                alt={menuItem.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            )}
                            
                            {/* Item Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{menuItem.name}</h5>
                                  <p className="text-sm text-gray-600">{formatCurrency(menuItem.price)}</p>
                                  {menuItem.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{menuItem.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(index, -1)}
                                    className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(index, 1)}
                                    className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Special Instructions Input */}
                              <input
                                type="text"
                                placeholder="Special instructions (optional)"
                                value={item.special_instructions || ''}
                                onChange={(e) => updateSpecialInstructions(index, e.target.value)}
                                className="mt-2 w-full px-3 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                              
                              <div className="mt-2 text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  Total: {formatCurrency(menuItem.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Any special requests from the customer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kitchen Notes
                    </label>
                    <textarea
                      value={formData.kitchen_notes}
                      onChange={(e) => setFormData({ ...formData, kitchen_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Notes for the kitchen staff..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online Payment</option>
                      <option value="mobile">Mobile Banking</option>
                    </select>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (10%)</span>
                      <span className="font-medium">{formatCurrency(totals.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Charge (5%)</span>
                      <span className="font-medium">{formatCurrency(totals.service_charge)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-xs text-gray-500">(optional)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            discount_amount: parseFloat(e.target.value) || 0 
                          })}
                          className="w-28 px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900">Total Amount</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(totals.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || submitting || formData.items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {initialData ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Select Menu Item Selector Modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Menu Items</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select multiple items to add to your order. You can adjust quantities for each.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setSelectedItems(new Set())
                  setItemQuantities(new Map())
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search menu items..."
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Selected Items Summary */}
              {selectedItems.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedItems.size} item(s) selected for addition
                  </p>
                </div>
              )}

              {/* Menu Items Grid with Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[45vh] overflow-y-auto">
                {filteredMenuItems.map((item) => {
                  const isSelected = selectedItems.has(item.id)
                  const quantity = itemQuantities.get(item.id) || 1
                  
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                          <IndianRupee className="h-12 w-12 text-blue-400" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection(item.id)}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                            </div>
                            {item.category_name && (
                              <p className="text-xs text-gray-500 mt-1 ml-6">{item.category_name}</p>
                            )}
                          </div>
                          {item.is_vegetarian && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Veg</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 ml-6">{item.description}</p>
                        <div className="mt-3 flex items-center justify-between ml-6">
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(item.price)}
                          </span>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateSelectedQuantity(item.id, -1)}
                                className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-10 text-center font-medium">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateSelectedQuantity(item.id, 1)}
                                className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredMenuItems.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>No menu items found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setSelectedItems(new Set())
                  setItemQuantities(new Map())
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={addMultipleItems}
                disabled={selectedItems.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Add Selected Items ({selectedItems.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}