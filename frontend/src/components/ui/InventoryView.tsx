// components/dashboard/views/InventoryView.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/index'
import { 
  fetchInventory, 
  fetchLowStockInventory,
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '@/store/slices/dashboardSlice'
import { Plus, Filter, Download, Edit, Trash2, Eye, Package, AlertCircle } from 'lucide-react'
import InventoryModal from './InventoryModal'
import ConfirmModal from './ConfirmModal'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

interface InventoryViewProps {
  hotelSlug: string
}

export default function InventoryView({ hotelSlug }: InventoryViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { inventoryList, loading } = useSelector((state: RootState) => state.dashboard)
  
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'low-stock'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (hotelSlug) {
      if (viewMode === 'low-stock') {
        dispatch(fetchLowStockInventory(hotelSlug))
      } else {
        dispatch(fetchInventory(hotelSlug))
      }
    }
  }, [hotelSlug, viewMode, dispatch])

  const handleCreateInventoryItem = async (itemData: any) => {
    try {
      await dispatch(createInventoryItem({ hotelSlug, inventoryData: itemData })).unwrap()
      toast.success('Inventory item created successfully')
      // setShowInventoryModal(false)
    } catch (error: any) {
      toast.error(error || 'Failed to create inventory item')
    }
  }

  const handleUpdateInventoryItem = async (itemData: any) => {
    try {
      await dispatch(updateInventoryItem({ 
        hotelSlug, 
        inventoryId: editingItem.id, 
        inventoryData: itemData 
      })).unwrap()
      toast.success('Inventory item updated successfully')
      setShowInventoryModal(false)
      setEditingItem(null)
    } catch (error: any) {
      toast.error(error || 'Failed to update inventory item')
    }
  }

  const handleDeleteInventoryItem = async () => {
    if (!selectedItem) return
    
    try {
      await dispatch(deleteInventoryItem({ hotelSlug, inventoryId: selectedItem.id })).unwrap()
      toast.success('Inventory item deleted successfully')
      setShowDeleteModal(false)
      setSelectedItem(null)
    } catch (error: any) {
      toast.error(error || 'Failed to delete inventory item')
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'in_stock': return 'bg-emerald-100 text-emerald-800';
      case 'low_stock': return 'bg-amber-100 text-amber-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'over_stock': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)
  }

  const categories = [...new Set(inventoryList.map(item => item.category).filter(Boolean))]

  const filteredItems = inventoryList.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesSearch = item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  const lowStockCount = inventoryList.filter(item => item.status === 'low_stock').length
  const outOfStockCount = inventoryList.filter(item => item.status === 'out_of_stock').length
  const inStockCount = inventoryList.filter(item => item.status === 'in_stock').length
  const totalValue = inventoryList.reduce((sum, item) => sum + (item.total_value || 0), 0)

  if (loading && inventoryList.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Inventory Management</h1>
            <p className="text-blue-100">Track and manage your hotel inventory</p>
          </div>
          <button 
            onClick={() => {
              setEditingItem(null)
              setShowInventoryModal(true)
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-gray-900">{inStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalValue.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            <button 
              onClick={() => setViewMode('low-stock')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'low-stock' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">
              {viewMode === 'low-stock' ? 'Low Stock Items' : 'All Inventory Items'}
            </h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {categories.length > 0 && (
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              )}
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="over_stock">Over Stock</option>
              </select>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
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
                <th className="p-4 font-medium">Quantity</th>
                <th className="p-4 font-medium">Unit Cost</th>
                <th className="p-4 font-medium">Total Value</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-600">{item.item_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {item.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.current_quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-600">Min: {item.min_quantity}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-900">${item.unit_cost?.toFixed(2) || '0.00'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">
                      ₹{(item.current_quantity * (item.unit_cost || 0)).toFixed(2)}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingItem(item)
                          setShowInventoryModal(true)
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedItem(item)
                          setShowDeleteModal(true)
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No inventory items found</p>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setShowInventoryModal(true)
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first inventory item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false)
          setEditingItem(null)
        }}
        onSubmit={editingItem ? handleUpdateInventoryItem : handleCreateInventoryItem}
        initialData={editingItem}
        hotelSlug={hotelSlug}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedItem(null)
        }}
        onConfirm={handleDeleteInventoryItem}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${selectedItem?.item_name}"? This action cannot be undone.`}
      />
    </div>
  )
}