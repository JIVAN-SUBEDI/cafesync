// // components/dashboard/views/MenuItemModal.tsx
// 'use client'

// import React, { useEffect, useMemo, useState } from 'react'
// import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
// import toast from 'react-hot-toast'

// type CategoryLite = {
//   id: string
//   name: string
//   is_active: boolean
// }

// interface MenuItemModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (data: any) => void
//   initialData?: any
//   hotelSlug: string
//   categories: CategoryLite[]
//   error?: string | null
//   isSubmitting?: boolean
// }

// export default function MenuItemModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
//   hotelSlug,
//   categories,
//   error: externalError,
//   isSubmitting: externalSubmitting = false,
// }: MenuItemModalProps) {
//   const [name, setName] = useState('')
//   const [description, setDescription] = useState('')
//   const [categoryId, setCategoryId] = useState('')
//   const [price, setPrice] = useState<number>(0)
//   const [costPrice, setCostPrice] = useState<number | null>(null)
//   const [taxRate, setTaxRate] = useState<number>(0)
//   const [preparationTime, setPreparationTime] = useState<number>(0)
//   const [isAvailable, setIsAvailable] = useState<boolean>(true)
//   const [isPopular, setIsPopular] = useState<boolean>(false)
//   const [isVegetarian, setIsVegetarian] = useState<boolean>(false)
//   const [dietaryInfo, setDietaryInfo] = useState<string>('')
//   const [imageUrl, setImageUrl] = useState<string>('')
  
//   // Image upload states
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [imagePreview, setImagePreview] = useState<string | null>(null)
//   const [isUploading, setIsUploading] = useState(false)
  
//   // Validation error states
//   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
//   const [localError, setLocalError] = useState<string | null>(null)

//   const activeCategories = useMemo(
//     () => (Array.isArray(categories) ? categories.filter((c) => c.is_active) : []),
//     [categories],
//   )

//   useEffect(() => {
//     if (!isOpen) return

//     setName(initialData?.name ?? '')
//     setDescription(initialData?.description ?? '')
//     setCategoryId(initialData?.category_id ?? '')
//     setPrice(Number(initialData?.price ?? 0))
//     setCostPrice(initialData?.cost_price ? Number(initialData.cost_price) : null)
//     setTaxRate(Number(initialData?.tax_rate ?? 0))
//     setPreparationTime(Number(initialData?.preparation_time ?? 0))
//     setIsAvailable(Boolean(initialData?.is_available ?? true))
//     setIsPopular(Boolean(initialData?.is_popular ?? false))
//     setIsVegetarian(Boolean(initialData?.is_vegetarian ?? false))
//     setDietaryInfo(initialData?.dietary_info ?? '')
//     setImageUrl(initialData?.image_url ?? '')
    
//     // Set image preview if there's an existing image
//     if (initialData?.image_url) {
//       setImagePreview(initialData.image_url)
//     } else {
//       setImagePreview(null)
//     }
    
//     // Reset file upload and errors
//     setImageFile(null)
//     setValidationErrors({})
//     setLocalError(null)
//   }, [isOpen, initialData])

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       // Validate file size (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error('Image size should be less than 5MB')
//         return
//       }

//       // Validate file type
//       if (!file.type.startsWith('image/')) {
//         toast.error('Please upload an image file')
//         return
//       }

//       setImageFile(file)
      
//       // Create preview URL
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         setImagePreview(reader.result as string)
//       }
//       reader.readAsDataURL(file)
      
//       // Clear the image_url when a new file is selected
//       setImageUrl('')
//     }
//   }

//   const handleRemoveImage = () => {
//     setImageFile(null)
//     setImagePreview(null)
//     setImageUrl('')
//   }

//   const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (e.target === e.currentTarget) onClose()
//   }

//   const validateForm = () => {
//     const errors: Record<string, string> = {}
    
//     if (!name.trim()) {
//       errors.name = 'Item name is required'
//     }
    
//     if (!categoryId) {
//       errors.category = 'Please select a category'
//     }
    
//     if (price <= 0) {
//       errors.price = 'Price must be greater than 0'
//     }
    
//     if (price > 999999) {
//       errors.price = 'Price is too high'
//     }
    
//     if (taxRate < 0 || taxRate > 100) {
//       errors.tax_rate = 'Tax rate must be between 0 and 100'
//     }
    
//     if (preparationTime < 0) {
//       errors.preparation_time = 'Preparation time cannot be negative'
//     }
    
//     setValidationErrors(errors)
//     return Object.keys(errors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//     // Reset errors
//     setValidationErrors({})
//     setLocalError(null)
    
//     // Validate form
//     if (!validateForm()) {
//       // Show toast for each validation error
//       Object.values(validationErrors).forEach(err => {
//         toast.error(err)
//       })
//       return
//     }
    
//     setIsUploading(true)

//     try {
//       const payload: any = {
//         name: name.trim(),
//         description: description.trim() || null,
//         category_id: categoryId,
//         price: Number(price) || 0,
//         tax_rate: Number(taxRate) || 0,
//         preparation_time:
//           preparationTime !== null && preparationTime !== undefined && preparationTime > 0
//             ? Number(preparationTime)
//             : null,
//         is_available: !!isAvailable,
//         is_popular: !!isPopular,
//         is_vegetarian: !!isVegetarian,
//       }

//       if (costPrice !== null && costPrice !== undefined && costPrice > 0) {
//         payload.cost_price = Number(costPrice)
//       }

//       if (dietaryInfo && dietaryInfo.trim()) {
//         payload.dietary_info = dietaryInfo.trim()
//       }

//       if (imageFile) {
//         payload.image = imageFile
//       } else if (imageUrl) {
//         payload.image_url = imageUrl
//       } else if (initialData && !imageFile && !imageUrl) {
//         payload.image_url = null
//       }

//       await onSubmit(payload)
      
//       // Success - modal will close via parent
//     } catch (error: any) {
//       console.error('Error submitting form:', error)
      
//       // Handle validation errors from backend
//       if (error?.response?.data?.errors) {
//         const errors = error.response.data.errors
//         const errorMap: Record<string, string> = {}
        
//         errors.forEach((err: any) => {
//           errorMap[err.field] = err.message
//           toast.error(`${err.field}: ${err.message}`)
//         })
        
//         setValidationErrors(errorMap)
//         setLocalError(error.response.data.message || 'Validation failed')
//       } 
//       // Handle general error with message
//       else if (error?.message) {
//         toast.error(error.message)
//         setLocalError(error.message)
//       } 
//       // Handle string error
//       else if (typeof error === 'string') {
//         toast.error(error)
//         setLocalError(error)
//       }
//       else {
//         toast.error('Failed to submit form')
//         setLocalError('Failed to submit form')
//       }
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   if (!isOpen) return null

//   const isProcessing = isUploading || externalSubmitting

//   return (
//     <div
//       onClick={handleBackdropClick}
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
//     >
//       <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
//           <div>
//             <h2 className="text-lg font-semibold text-gray-900">
//               {initialData ? 'Edit Menu Item' : 'Add Menu Item'}
//             </h2>
//             <p className="text-sm text-gray-600">
//               {initialData ? 'Update your menu item details.' : 'Create a new menu item.'}
//             </p>
//           </div>

//           <button
//             onClick={onClose}
//             className="p-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
//             aria-label="Close"
//             disabled={isProcessing}
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         {/* Display global error */}
//         {(localError || externalError) && (
//           <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
//             <p className="text-sm text-red-600">{localError || externalError}</p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           {/* Image Upload Section */}
//           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//             <label className="block text-sm font-medium text-gray-700 mb-3">
//               Item Image
//             </label>
//             <div className="flex flex-col sm:flex-row items-start gap-4">
//               {/* Image Preview */}
//               <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-white">
//                 {imagePreview ? (
//                   <>
//                     <img
//                       src={imagePreview}
//                       alt="Menu item preview"
//                       className="w-full h-full object-cover"
//                     />
//                     <button
//                       type="button"
//                       onClick={handleRemoveImage}
//                       className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-90 hover:opacity-100 transition-opacity shadow-sm"
//                       title="Remove image"
//                       disabled={isProcessing}
//                     >
//                       <Trash2 className="h-3 w-3" />
//                     </button>
//                   </>
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center bg-gray-100">
//                     <ImageIcon className="h-10 w-10 text-gray-400" />
//                   </div>
//                 )}
//               </div>

//               {/* Upload Controls */}
//               <div className="flex-1 space-y-3">
//                 <div>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageChange}
//                     className="hidden"
//                     id="menu-item-image-upload"
//                     disabled={isProcessing}
//                   />
//                   <label
//                     htmlFor="menu-item-image-upload"
//                     className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
//                       isProcessing ? 'opacity-50 cursor-not-allowed' : ''
//                     }`}
//                   >
//                     <Upload className="h-4 w-4" />
//                     {imagePreview ? 'Change Image' : 'Upload Image'}
//                   </label>
//                 </div>
                
//                 <p className="text-xs text-gray-500">
//                   PNG, JPG, GIF up to 5MB. Recommended size: 500x500px.
//                 </p>
                
//                 {/* OR Divider */}
//                 <div className="relative">
//                   <div className="absolute inset-0 flex items-center">
//                     <div className="w-full border-t border-gray-200"></div>
//                   </div>
//                   <div className="relative flex justify-center text-xs">
//                     <span className="bg-gray-50 px-2 text-gray-500">OR</span>
//                   </div>
//                 </div>

//                 {/* Image URL Input */}
//                 <div>
//                   <label className="block text-xs font-medium text-gray-500 mb-1">
//                     Image URL (use instead of upload)
//                   </label>
//                   <input
//                     value={imageUrl}
//                     onChange={(e) => {
//                       setImageUrl(e.target.value)
//                       if (e.target.value) {
//                         setImageFile(null)
//                         setImagePreview(e.target.value)
//                       } else if (!e.target.value && !imageFile) {
//                         setImagePreview(null)
//                       }
//                     }}
//                     placeholder="https://example.com/image.jpg"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     disabled={isProcessing || !!imageFile}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Name */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Item Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               value={name}
//               onChange={(e) => {
//                 setName(e.target.value)
//                 if (validationErrors.name) {
//                   setValidationErrors(prev => ({ ...prev, name: '' }))
//                 }
//               }}
//               required
//               placeholder="e.g. Chicken Momo"
//               className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 validationErrors.name 
//                   ? 'border-red-500 bg-red-50' 
//                   : 'border-gray-300'
//               }`}
//               disabled={isProcessing}
//             />
//             {validationErrors.name && (
//               <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
//             )}
//           </div>

//           {/* Category */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Category <span className="text-red-500">*</span>
//             </label>
//             <select
//               value={categoryId}
//               onChange={(e) => {
//                 setCategoryId(e.target.value)
//                 if (validationErrors.category) {
//                   setValidationErrors(prev => ({ ...prev, category: '' }))
//                 }
//               }}
//               required
//               className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 validationErrors.category 
//                   ? 'border-red-500 bg-red-50' 
//                   : 'border-gray-300'
//               }`}
//               disabled={isProcessing}
//             >
//               <option value="">Select category</option>
//               {activeCategories.map((c) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//             {validationErrors.category && (
//               <p className="mt-1 text-xs text-red-600">{validationErrors.category}</p>
//             )}
//             {activeCategories.length === 0 && (
//               <p className="mt-1 text-xs text-amber-600">
//                 No active categories found. Create a category first.
//               </p>
//             )}
//           </div>

//           {/* Price + Cost Price + Tax */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Price (रु) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="number"
//                 step="1"
//                 min="0"
//                 value={price}
//                 onChange={(e) => {
//                   setPrice(Number(e.target.value))
//                   if (validationErrors.price) {
//                     setValidationErrors(prev => ({ ...prev, price: '' }))
//                   }
//                 }}
//                 required
//                 className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                   validationErrors.price 
//                     ? 'border-red-500 bg-red-50' 
//                     : 'border-gray-300'
//                 }`}
//                 disabled={isProcessing}
//               />
//               {validationErrors.price && (
//                 <p className="mt-1 text-xs text-red-600">{validationErrors.price}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Cost Price (रु)
//               </label>
//               <input
//                 type="number"
//                 step="1"
//                 min="0"
//                 value={costPrice || ''}
//                 onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : null)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 disabled={isProcessing}
//                 placeholder="Optional"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Tax Rate (%)
//               </label>
//               <input
//                 type="number"
//                 step="1"
//                 min="0"
//                 max="100"
//                 value={taxRate}
//                 onChange={(e) => {
//                   setTaxRate(Number(e.target.value))
//                   if (validationErrors.tax_rate) {
//                     setValidationErrors(prev => ({ ...prev, tax_rate: '' }))
//                   }
//                 }}
//                 className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                   validationErrors.tax_rate 
//                     ? 'border-red-500 bg-red-50' 
//                     : 'border-gray-300'
//                 }`}
//                 disabled={isProcessing}
//               />
//               {validationErrors.tax_rate && (
//                 <p className="mt-1 text-xs text-red-600">{validationErrors.tax_rate}</p>
//               )}
//             </div>
//           </div>

//           {/* Prep time */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Preparation Time (minutes)
//             </label>
//             <input
//               type="number"
//               min="0"
//               value={preparationTime}
//               onChange={(e) => {
//                 setPreparationTime(Number(e.target.value))
//                 if (validationErrors.preparation_time) {
//                   setValidationErrors(prev => ({ ...prev, preparation_time: '' }))
//                 }
//               }}
//               className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 validationErrors.preparation_time 
//                   ? 'border-red-500 bg-red-50' 
//                   : 'border-gray-300'
//               }`}
//               disabled={isProcessing}
//             />
//             {validationErrors.preparation_time && (
//               <p className="mt-1 text-xs text-red-600">{validationErrors.preparation_time}</p>
//             )}
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description
//             </label>
//             <textarea
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               placeholder="Optional description..."
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               disabled={isProcessing}
//             />
//           </div>

//           {/* Dietary Info */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Dietary Information
//             </label>
//             <input
//               type="text"
//               value={dietaryInfo}
//               onChange={(e) => setDietaryInfo(e.target.value)}
//               placeholder="e.g., Gluten-free, Contains nuts, etc."
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               disabled={isProcessing}
//             />
//           </div>

//           {/* Toggles */}
//           <div className="flex flex-wrap gap-4 pt-2">
//             <label className="flex items-center gap-2 text-sm text-gray-700">
//               <input
//                 type="checkbox"
//                 checked={isAvailable}
//                 onChange={(e) => setIsAvailable(e.target.checked)}
//                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 disabled={isProcessing}
//               />
//               Available
//             </label>

//             <label className="flex items-center gap-2 text-sm text-gray-700">
//               <input
//                 type="checkbox"
//                 checked={isPopular}
//                 onChange={(e) => setIsPopular(e.target.checked)}
//                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 disabled={isProcessing}
//               />
//               Popular
//             </label>

//             <label className="flex items-center gap-2 text-sm text-gray-700">
//               <input
//                 type="checkbox"
//                 checked={isVegetarian}
//                 onChange={(e) => setIsVegetarian(e.target.checked)}
//                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                 disabled={isProcessing}
//               />
//               Vegetarian
//             </label>
//           </div>

//           {/* Form Actions */}
//           <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
//               disabled={isProcessing}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//               disabled={!categoryId || isProcessing}
//             >
//               {isProcessing ? (
//                 <>
//                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                   Processing...
//                 </>
//               ) : (
//                 initialData ? 'Update Item' : 'Create Item'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }




// components/dashboard/views/MenuItemModal.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type CategoryLite = {
  id: string
  name: string
  is_active: boolean
}

interface MenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: any
  hotelSlug: string
  categories: CategoryLite[]
  error?: string | null
  isSubmitting?: boolean
}

export default function MenuItemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  hotelSlug,
  categories,
  error: externalError,
  isSubmitting: externalSubmitting = false,
}: MenuItemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number | null>(null)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [preparationTime, setPreparationTime] = useState<number>(0)
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [isPopular, setIsPopular] = useState<boolean>(false)
  const [isVegetarian, setIsVegetarian] = useState<boolean>(false)
  const [dietaryInfo, setDietaryInfo] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  
  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Validation error states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [localError, setLocalError] = useState<string | null>(null)

  const activeCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((c) => c.is_active) : []),
    [categories],
  )

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) return

    setName(initialData?.name ?? '')
    setDescription(initialData?.description ?? '')
    setCategoryId(initialData?.category_id ?? '')
    setPrice(Number(initialData?.price ?? 0))
    setCostPrice(initialData?.cost_price ? Number(initialData.cost_price) : null)
    setTaxRate(Number(initialData?.tax_rate ?? 0))
    setPreparationTime(Number(initialData?.preparation_time ?? 0))
    setIsAvailable(Boolean(initialData?.is_available ?? true))
    setIsPopular(Boolean(initialData?.is_popular ?? false))
    setIsVegetarian(Boolean(initialData?.is_vegetarian ?? false))
    setDietaryInfo(initialData?.dietary_info ?? '')
    setImageUrl(initialData?.image_url ?? '')
    
    // Set image preview if there's an existing image
    if (initialData?.image_url) {
      setImagePreview(initialData.image_url)
    } else {
      setImagePreview(null)
    }
    
    // Reset file upload and errors
    setImageFile(null)
    setValidationErrors({})
    setLocalError(null)
  }, [isOpen, initialData])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      setImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear the image_url when a new file is selected
      setImageUrl('')
      // Clear any image validation errors
      if (validationErrors.image) {
        setValidationErrors(prev => ({ ...prev, image: '' }))
      }
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl('')
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!name.trim()) {
      errors.name = 'Item name is required'
    }
    
    if (!categoryId) {
      errors.category = 'Please select a category'
    }
    
    if (price <= 0) {
      errors.price = 'Price must be greater than 0'
    } else if (price > 999999) {
      errors.price = 'Price is too high (max 999,999)'
    }
    
    if (taxRate < 0 || taxRate > 100) {
      errors.tax_rate = 'Tax rate must be between 0 and 100'
    }
    
    if (preparationTime < 0) {
      errors.preparation_time = 'Preparation time cannot be negative'
    }
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      // Show toast for each validation error
      Object.values(errors).forEach(err => {
        toast.error(err)
      })
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setValidationErrors({})
    setLocalError(null)
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsUploading(true)

    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        price: Number(price) || 0,
        tax_rate: Number(taxRate) || 0,
        preparation_time: preparationTime > 0 ? Number(preparationTime) : null,
        is_available: !!isAvailable,
        is_popular: !!isPopular,
        is_vegetarian: !!isVegetarian,
      }

      if (costPrice !== null && costPrice !== undefined && costPrice > 0) {
        payload.cost_price = Number(costPrice)
      }

      if (dietaryInfo && dietaryInfo.trim()) {
        payload.dietary_info = dietaryInfo.trim()
      }

      // Handle image
      if (imageFile) {
        payload.image = imageFile
      } else if (imageUrl) {
        payload.image_url = imageUrl
      } else if (initialData && !imageFile && !imageUrl) {
        payload.image_url = null
      }

      await onSubmit(payload)
      
      // Success - modal will close via parent
    } catch (error: any) {
      console.error('Error submitting form:', error)
      
      // Handle validation errors from backend
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMap: Record<string, string> = {}
        
        errors.forEach((err: any) => {
          errorMap[err.field] = err.message
          toast.error(`${err.field}: ${err.message}`)
        })
        
        setValidationErrors(errorMap)
        setLocalError(error.response.data.message || 'Validation failed')
      } 
      // Handle string error
      else if (typeof error === 'string') {
        toast.error(error)
        setLocalError(error)
      }
      // Handle error with message
      else if (error?.message) {
        toast.error(error.message)
        setLocalError(error.message)
      }
      else {
        toast.error('Failed to submit form')
        setLocalError('Failed to submit form')
      }
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  const isProcessing = isUploading || externalSubmitting

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            <p className="text-sm text-gray-600">
              {initialData ? 'Update your menu item details.' : 'Create a new menu item.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
            aria-label="Close"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display global error */}
        {(localError || externalError) && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{localError || externalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Item Image
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Image Preview */}
              <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-white">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Menu item preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-90 hover:opacity-100 transition-opacity shadow-sm"
                      title="Remove image"
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="menu-item-image-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="menu-item-image-upload"
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
                
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB. Recommended size: 500x500px.
                </p>
                
                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-gray-50 px-2 text-gray-500">OR</span>
                  </div>
                </div>

                {/* Image URL Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Image URL (use instead of upload)
                  </label>
                  <input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      if (e.target.value) {
                        setImageFile(null)
                        setImagePreview(e.target.value)
                      } else if (!e.target.value && !imageFile) {
                        setImagePreview(null)
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing || !!imageFile}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (validationErrors.name) {
                  setValidationErrors(prev => ({ ...prev, name: '' }))
                }
              }}
              required
              placeholder="e.g. Chicken Momo"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.name 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={isProcessing}
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                if (validationErrors.category) {
                  setValidationErrors(prev => ({ ...prev, category: '' }))
                }
              }}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.category 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={isProcessing}
            >
              <option value="">Select category</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.category}</p>
            )}
            {activeCategories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No active categories found. Create a category first.
              </p>
            )}
          </div>

          {/* Price + Cost Price + Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (रु) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value))
                  if (validationErrors.price) {
                    setValidationErrors(prev => ({ ...prev, price: '' }))
                  }
                }}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.price 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
                disabled={isProcessing}
              />
              {validationErrors.price && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (रु)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(Number(e.target.value))
                  if (validationErrors.tax_rate) {
                    setValidationErrors(prev => ({ ...prev, tax_rate: '' }))
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.tax_rate 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
                disabled={isProcessing}
              />
              {validationErrors.tax_rate && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.tax_rate}</p>
              )}
            </div>
          </div>

          {/* Prep time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preparation Time (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={preparationTime}
              onChange={(e) => {
                setPreparationTime(Number(e.target.value))
                if (validationErrors.preparation_time) {
                  setValidationErrors(prev => ({ ...prev, preparation_time: '' }))
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.preparation_time 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={isProcessing}
            />
            {validationErrors.preparation_time && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.preparation_time}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
          </div>

          {/* Dietary Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Information
            </label>
            <input
              type="text"
              value={dietaryInfo}
              onChange={(e) => setDietaryInfo(e.target.value)}
              placeholder="e.g., Gluten-free, Contains nuts, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              Available
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              Popular
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              Vegetarian
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!categoryId || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                initialData ? 'Update Item' : 'Create Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}