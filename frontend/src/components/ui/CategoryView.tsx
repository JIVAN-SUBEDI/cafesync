
'use client'

import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/index'
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '@/store/slices/dashboardSlice'
import { Plus, Filter, Edit, Trash2, Eye, FolderTree, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'
import CategoryModal from './CategoryModal'
import ConfirmModal from './ConfirmModal'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import { set } from 'lodash'

interface CategoryViewProps {
  hotelSlug: string,
  currencySymbol: string
}

export default function CategoryView({ hotelSlug, currencySymbol }: CategoryViewProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { categoriesList, loading, error } = useSelector((state: RootState) => state.dashboard)
  console.log('Categories List:', categoriesList) // Debug log to check the structure of categoriesList
  
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)


  useEffect(() => {
    dispatch(fetchCategories())
  }, [hotelSlug, dispatch])

  const handleCreateCategory = async (categoryData: any) => {
    try {
      console.log('Creating category with data:', categoryData)
      await dispatch(createCategory({ hotelSlug, categoryData })).unwrap()
      toast.success('Category created successfully')
      setShowCategoryModal(false)
    } catch (error: any) {
      toast.error(error || 'Failed to create category')
    }
  }

  const handleUpdateCategory = async (categoryData: any) => {
    try {
      await dispatch(updateCategory({ 
        hotelSlug, 
        categoryId: editingCategory.id, 
        categoryData 
      })).unwrap()
      toast.success('Category updated successfully')
      setShowCategoryModal(false)
      setEditingCategory(null)
    } catch (error: any) {
      toast.error(error || 'Failed to update category')
    }
  }
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return
    
    try {
      await dispatch(deleteCategory({ hotelSlug, categoryId: selectedCategory.id })).unwrap()
      toast.success('Category deleted successfully')
      setShowDeleteModal(false)
      setSelectedCategory(null)
    } catch (error: any) {
      toast.error(error || 'Failed to delete category')
    }
  }

  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }))
  }

  const filteredCategories = categoriesList.filter(category => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return category.is_active
    if (filterStatus === 'inactive') return !category.is_active
    return true
  })

  const activeCategoriesCount = categoriesList.filter(c => c.is_active).length
  const inactiveCategoriesCount = categoriesList.filter(c => !c.is_active).length

  if (loading && categoriesList.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Menu Categories</h1>
            <p className="text-blue-100">Organize your menu items by categories</p>
          </div>
          <button 
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FolderTree className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categoriesList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeCategoriesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveCategoriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">All Categories</h3>
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No categories found</p>
              <button 
                onClick={() => {
                  setEditingCategory(null)
                  setShowCategoryModal(true)
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
                  {/* Category Image - Fixed height container */}
                  <div className="relative h-48 w-full bg-gray-100">
                    {category.image_url && !imageErrors[category.id] ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(category.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge - Fixed positioning */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                        category.is_active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Category Content - Fixed padding and spacing */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg">{category.name}</h3>
                      </div>
                      
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Menu Items</p>
                          <p className="text-lg font-bold text-gray-900">{category.items || 0}</p>
                        </div>
                        {category.avg_price > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Avg. Price</p>
                            <p className="text-lg font-bold text-gray-900">{currencySymbol} {category.avg_price.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Buttons - Always at bottom */}
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                      <button 
                        onClick={() => {
                          setEditingCategory(category)
                          setShowCategoryModal(true)
                        }}
                        className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedCategory(category)
                          setShowDeleteModal(true)
                        }}
                        className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setEditingCategory(null)
        }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={editingCategory}
        error={error}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedCategory(null)
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This will also remove all menu items in this category.`}
      />
    </div>
  )
}