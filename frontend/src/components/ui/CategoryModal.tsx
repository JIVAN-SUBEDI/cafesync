// // components/dashboard/modals/CategoryModal.tsx
// 'use client'

// import React, { useState, useEffect } from 'react'
// import { X } from 'lucide-react'

// interface CategoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (categoryData: any) => void
//   initialData?: any
// }

// export default function CategoryModal({ isOpen, onClose, onSubmit, initialData }: CategoryModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     display_order: 0,
//     is_active: true,
//     image_url: ''
//   })

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         name: initialData.name || '',
//         description: initialData.description || '',
//         display_order: initialData.display_order || 0,
//         is_active: initialData.is_active !== undefined ? initialData.is_active : true,
//         image_url: initialData.image_url || ''
//       })
//     } else {
//       setFormData({
//         name: '',
//         description: '',
//         display_order: 0,
//         is_active: true,
//         image_url: ''
//       })
//     }
//   }, [initialData])

//   if (!isOpen) return null

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSubmit(formData)
//   }

//   return (
//     <div className="fixed inset-0 z-[9999] overflow-y-auto isolate">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//         <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
//         <div className="inline-block relative z-[10000] w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-900">
//               {initialData ? 'Edit Category' : 'Add New Category'}
//             </h3>
//             <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
//               <X className="h-5 w-5" />
//             </button>
//           </div>
          
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Category Name *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter category name"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter category description"
//                   rows={3}
//                 />
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Display Order
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={formData.display_order}
//                     onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Order number"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Image URL
//                   </label>
//                   <input
//                     type="url"
//                     value={formData.image_url}
//                     onChange={(e) => setFormData({...formData, image_url: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="https://example.com/image.jpg"
//                   />
//                 </div>
//               </div>
              
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="is_active"
//                   checked={formData.is_active}
//                   onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
//                   className="h-4 w-4 text-blue-600 rounded"
//                 />
//                 <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
//                   Active Status
//                 </label>
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-3 mt-6">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
//               >
//                 {initialData ? 'Update Category' : 'Add Category'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }



















// // components/dashboard/modals/CategoryModal.tsx
// 'use client'

// import React, { useEffect, useState } from 'react'
// import { X } from 'lucide-react'

// interface CategoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (categoryData: any) => void
//   initialData?: any
// }

// export default function CategoryModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
// }: CategoryModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     display_order: 0,
//     is_active: true,
//     image_url: '',
//   })

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         name: initialData.name || '',
//         description: initialData.description || '',
//         display_order: initialData.display_order || 0,
//         is_active: initialData.is_active !== undefined ? initialData.is_active : true,
//         image_url: initialData.image_url || '',
//       })
//     } else {
//       setFormData({
//         name: '',
//         description: '',
//         display_order: 0,
//         is_active: true,
//         image_url: '',
//       })
//     }
//   }, [initialData])

//   if (!isOpen) return null

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSubmit(formData)
//   }

//   return (
//     <div className="fixed inset-0 z-[9999] isolate overflow-y-auto">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-gray-500/75"
//         onClick={onClose}
//         aria-hidden="true"
//       />

//       {/* Centered modal container */}
//       <div className="flex min-h-screen items-center justify-center px-4 py-10">
//         {/* Modal panel */}
//         <div
//           role="dialog"
//           aria-modal="true"
//           className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl"
//         >
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-gray-900">
//               {initialData ? 'Edit Category' : 'Add New Category'}
//             </h3>
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded p-1 hover:bg-gray-100"
//               aria-label="Close"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Category Name *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//                   placeholder="Enter category name"
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//                   placeholder="Enter category description"
//                   rows={3}
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-gray-700">
//                     Display Order
//                   </label>
//                   <input
//                     type="number"
//                     min={0}
//                     value={formData.display_order}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         display_order: parseInt(e.target.value, 10) || 0,
//                       })
//                     }
//                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//                     placeholder="Order number"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-gray-700">
//                     Image URL
//                   </label>
//                   <input
//                     type="url"
//                     value={formData.image_url}
//                     onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
//                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//                     placeholder="https://example.com/image.jpg"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="is_active"
//                   checked={formData.is_active}
//                   onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                   className="h-4 w-4 rounded text-blue-600"
//                 />
//                 <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
//                   Active Status
//                 </label>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
//               >
//                 {initialData ? 'Update Category' : 'Add Category'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }








// // components/dashboard/modals/CategoryModal.tsx
// 'use client'

// import React, { useEffect, useState } from 'react'
// import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
// import Image from 'next/image'

// interface CategoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (categoryData: any) => void
//   initialData?: any
// }

// export default function CategoryModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
// }: CategoryModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     display_order: 0,
//     is_active: true,
//     image_url: '',
//   })
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [imagePreview, setImagePreview] = useState<string | null>(null)
//   const [isUploading, setIsUploading] = useState(false)

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         name: initialData.name || '',
//         description: initialData.description || '',
//         display_order: initialData.display_order || 0,
//         is_active: initialData.is_active !== undefined ? initialData.is_active : true,
//         image_url: initialData.image_url || '',
//       })
//       setImagePreview(initialData.image_url || null)
//     } else {
//       setFormData({
//         name: '',
//         description: '',
//         display_order: 0,
//         is_active: true,
//         image_url: '',
//       })
//       setImagePreview(null)
//     }
//     setImageFile(null)
//   }, [initialData, isOpen])

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       // Validate file size (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         alert('Image size should be less than 5MB')
//         return
//       }

//       // Validate file type
//       if (!file.type.startsWith('image/')) {
//         alert('Please upload an image file')
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
//       setFormData(prev => ({ ...prev, image_url: '' }))
//     }
//   }

//   const handleRemoveImage = () => {
//     setImageFile(null)
//     setImagePreview(null)
//     setFormData(prev => ({ ...prev, image_url: '' }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsUploading(true)

//     try {
//       // If there's a new image file, convert to base64 or handle upload
//       if (imageFile) {
//         // Convert image to base64
//         const reader = new FileReader()
//         reader.readAsDataURL(imageFile)
//         reader.onloadend = () => {
//           const base64Image = reader.result as string
//           onSubmit({
//             ...formData,
//             image_url: base64Image, // Send base64 image
//             imageFile: imageFile, // Also send the file if needed
//           })
//           setIsUploading(false)
//         }
//         reader.onerror = () => {
//           alert('Error reading image file')
//           setIsUploading(false)
//         }
//       } else {
//         // No new image, submit as is
//         onSubmit(formData)
//         setIsUploading(false)
//       }
//     } catch (error) {
//       console.error('Error submitting form:', error)
//       alert('Error submitting form')
//       setIsUploading(false)
//     }
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-[9999] isolate overflow-y-auto">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-gray-500/75 transition-opacity"
//         onClick={onClose}
//         aria-hidden="true"
//       />

//       {/* Centered modal container */}
//       <div className="flex min-h-screen items-center justify-center px-4 py-10">
//         {/* Modal panel */}
//         <div
//           role="dialog"
//           aria-modal="true"
//           className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
//             <h3 className="text-lg font-semibold text-gray-900">
//               {initialData ? 'Edit Category' : 'Add New Category'}
//             </h3>
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
//               aria-label="Close"
//             >
//               <X className="h-5 w-5 text-gray-500" />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit} className="p-6">
//             <div className="space-y-5">
//               {/* Image Upload Section */}
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-gray-700">
//                   Category Image
//                 </label>
//                 <div className="flex items-start gap-4">
//                   {/* Image Preview */}
//                   <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
//                     {imagePreview ? (
//                       <>
//                         <Image
//                           src={imagePreview}
//                           alt="Category preview"
//                           fill
//                           className="object-cover"
//                           sizes="96px"
//                         />
//                         <button
//                           type="button"
//                           onClick={handleRemoveImage}
//                           className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-90 hover:opacity-100 transition-opacity"
//                           title="Remove image"
//                         >
//                           <Trash2 className="h-3 w-3" />
//                         </button>
//                       </>
//                     ) : (
//                       <div className="flex h-full w-full items-center justify-center">
//                         <ImageIcon className="h-8 w-8 text-gray-400" />
//                       </div>
//                     )}
//                   </div>

//                   {/* Upload Button */}
//                   <div className="flex-1">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="hidden"
//                       id="category-image-upload"
//                       disabled={isUploading}
//                     />
//                     <label
//                       htmlFor="category-image-upload"
//                       className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
//                         isUploading ? 'opacity-50 cursor-not-allowed' : ''
//                       }`}
//                     >
//                       <Upload className="h-4 w-4" />
//                       {imagePreview ? 'Change Image' : 'Upload Image'}
//                     </label>
//                     <p className="mt-1 text-xs text-gray-500">
//                       PNG, JPG, GIF up to 5MB
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Category Name */}
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Category Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                   placeholder="e.g., Appetizers, Main Course, Desserts"
//                   disabled={isUploading}
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                   placeholder="Brief description of this category..."
//                   rows={3}
//                   disabled={isUploading}
//                 />
//               </div>

//               {/* Display Order and Image URL (if you want to keep URL option) */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-gray-700">
//                     Display Order
//                   </label>
//                   <input
//                     type="number"
//                     min={0}
//                     value={formData.display_order}
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         display_order: parseInt(e.target.value, 10) || 0,
//                       })
//                     }
//                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                     placeholder="Order number"
//                     disabled={isUploading}
//                   />
//                 </div>

//                 {/* Optional: Keep URL field for backward compatibility */}
//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-gray-700">
//                     Image URL (optional)
//                   </label>
//                   <input
//                     type="url"
//                     value={formData.image_url}
//                     onChange={(e) => {
//                       setFormData({ ...formData, image_url: e.target.value })
//                       // Clear file upload if URL is manually entered
//                       if (e.target.value) {
//                         setImageFile(null)
//                         setImagePreview(e.target.value)
//                       }
//                     }}
//                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                     placeholder="https://example.com/image.jpg"
//                     disabled={isUploading || !!imageFile}
//                   />
//                 </div>
//               </div>

//               {/* Active Status */}
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="is_active"
//                   checked={formData.is_active}
//                   onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                   className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                   disabled={isUploading}
//                 />
//                 <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
//                   Active Status (visible on menu)
//                 </label>
//               </div>
//             </div>

//             {/* Form Actions */}
//             <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
//                 disabled={isUploading}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={isUploading}
//                 className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//               >
//                 {isUploading ? (
//                   <>
//                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                     Processing...
//                   </>
//                 ) : (
//                   initialData ? 'Update Category' : 'Add Category'
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }





// // components/dashboard/modals/CategoryModal.tsx
// 'use client'

// import React, { useEffect, useState } from 'react'
// import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
// import Image from 'next/image'

// interface CategoryModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onSubmit: (categoryData: any) => void
//   initialData?: any
// }

// export default function CategoryModal({
//   isOpen,
//   onClose,
//   onSubmit,
//   initialData,
// }: CategoryModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     display_order: 0,
//     is_active: true,
//     image_url: '',
//   })
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [imagePreview, setImagePreview] = useState<string | null>(null)
//   const [isUploading, setIsUploading] = useState(false)

//   useEffect(() => {
//     if (initialData) {
//       setFormData({
//         name: initialData.name || '',
//         description: initialData.description || '',
//         display_order: initialData.display_order || 0,
//         is_active: initialData.is_active !== undefined ? initialData.is_active : true,
//         image_url: initialData.image_url || '',
//       })
//       setImagePreview(initialData.image_url || null)
//     } else {
//       setFormData({
//         name: '',
//         description: '',
//         display_order: 0,
//         is_active: true,
//         image_url: '',
//       })
//       setImagePreview(null)
//     }
//     setImageFile(null)
//   }, [initialData, isOpen])

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       // Validate file size (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         alert('Image size should be less than 5MB')
//         return
//       }

//       // Validate file type
//       if (!file.type.startsWith('image/')) {
//         alert('Please upload an image file')
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
//       setFormData(prev => ({ ...prev, image_url: '' }))
//     }
//   }

//   const handleRemoveImage = () => {
//     setImageFile(null)
//     setImagePreview(null)
//     setFormData(prev => ({ ...prev, image_url: '' }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsUploading(true)

//     try {
//       // Prepare the data to submit
//       const submitData: any = {
//         name: formData.name,
//         description: formData.description,
//         display_order: formData.display_order,
//         is_active: formData.is_active,
//       }

//       // If there's a new image file, add it as a File object
//       if (imageFile) {
//         submitData.image = imageFile
//       } 
//       // If no new image but there's an existing image_url, keep it
//       else if (formData.image_url) {
//         submitData.image_url = formData.image_url
//       }
      
//       // For updating, also include the image_url if it's being removed
//       if (initialData && !imageFile && !formData.image_url) {
//         submitData.image_url = null // Signal to remove image
//       }

//       // Pass the data to the parent component
//       await onSubmit(submitData)
//       setIsUploading(false)
//     } catch (error) {
//       console.error('Error submitting form:', error)
//       alert('Error submitting form')
//       setIsUploading(false)
//     }
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-[9999] isolate overflow-y-auto">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-gray-500/75 transition-opacity"
//         onClick={onClose}
//         aria-hidden="true"
//       />

//       {/* Centered modal container */}
//       <div className="flex min-h-screen items-center justify-center px-4 py-10">
//         {/* Modal panel */}
//         <div
//           role="dialog"
//           aria-modal="true"
//           className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
//             <h3 className="text-lg font-semibold text-gray-900">
//               {initialData ? 'Edit Category' : 'Add New Category'}
//             </h3>
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
//               aria-label="Close"
//             >
//               <X className="h-5 w-5 text-gray-500" />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit} className="p-6">
//             <div className="space-y-5">
//               {/* Image Upload Section */}
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-gray-700">
//                   Category Image
//                 </label>
//                 <div className="flex items-start gap-4">
//                   {/* Image Preview */}
//                   <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
//                     {imagePreview ? (
//                       <>
//                         <img
//                           src={imagePreview}
//                           alt="Category preview"
//                           className="object-cover"
//                           sizes="96px"
//                         />
//                         <button
//                           type="button"
//                           onClick={handleRemoveImage}
//                           className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-90 hover:opacity-100 transition-opacity"
//                           title="Remove image"
//                         >
//                           <Trash2 className="h-3 w-3" />
//                         </button>
//                       </>
//                     ) : (
//                       <div className="flex h-full w-full items-center justify-center">
//                         <ImageIcon className="h-8 w-8 text-gray-400" />
//                       </div>
//                     )}
//                   </div>

//                   {/* Upload Button */}
//                   <div className="flex-1">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="hidden"
//                       id="category-image-upload"
//                       disabled={isUploading}
//                     />
//                     <label
//                       htmlFor="category-image-upload"
//                       className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
//                         isUploading ? 'opacity-50 cursor-not-allowed' : ''
//                       }`}
//                     >
//                       <Upload className="h-4 w-4" />
//                       {imagePreview ? 'Change Image' : 'Upload Image'}
//                     </label>
//                     <p className="mt-1 text-xs text-gray-500">
//                       PNG, JPG, GIF up to 5MB
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Category Name */}
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Category Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                   placeholder="e.g., Appetizers, Main Course, Desserts"
//                   disabled={isUploading}
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                   placeholder="Brief description of this category..."
//                   rows={3}
//                   disabled={isUploading}
//                 />
//               </div>

//               {/* Display Order */}
//               <div>
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Display Order
//                 </label>
//                 <input
//                   type="number"
//                   min={0}
//                   value={formData.display_order}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       display_order: parseInt(e.target.value, 10) || 0,
//                     })
//                   }
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//                   placeholder="Order number"
//                   disabled={isUploading}
//                 />
//               </div>

//               {/* Active Status */}
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="is_active"
//                   checked={formData.is_active}
//                   onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                   className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                   disabled={isUploading}
//                 />
//                 <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
//                   Active Status (visible on menu)
//                 </label>
//               </div>
//             </div>

//             {/* Form Actions */}
//             <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
//                 disabled={isUploading}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={isUploading}
//                 className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//               >
//                 {isUploading ? (
//                   <>
//                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                     Processing...
//                   </>
//                 ) : (
//                   initialData ? 'Update Category' : 'Add Category'
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }




// components/dashboard/modals/CategoryModal.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (categoryData: any) => void
  initialData?: any
  error?: string | null // Add error prop
  isSubmitting?: boolean // Add submitting prop
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  error,
  isSubmitting = false,
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
    image_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        display_order: initialData.display_order || 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        image_url: initialData.image_url || '',
      })
      setImagePreview(initialData.image_url || null)
    } else {
      setFormData({
        name: '',
        description: '',
        display_order: 0,
        is_active: true,
        image_url: '',
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setValidationErrors({})
    setLocalError(null)
  }, [initialData, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB')
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
      setFormData(prev => ({ ...prev, image_url: '' }))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setValidationErrors({})
    setLocalError(null)
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      setValidationErrors(prev => ({ ...prev, name: 'Category name is required' }))
      return
    }


    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData()
      
      // Append text fields
      formDataToSend.append('name', formData.name)
      if (formData.description) {
        formDataToSend.append('description', formData.description)
      }
      // Convert display_order to string (FormData only accepts strings)
      formDataToSend.append('display_order', String(formData.display_order))
      formDataToSend.append('is_active', String(formData.is_active))
      
      // Handle image
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      } 
      // If no new image but there's an existing image_url, send it
      else if (formData.image_url) {
        formDataToSend.append('image_url', formData.image_url)
      }
      // For updates, if removing image
      else if (initialData && !imageFile && !formData.image_url) {
        formDataToSend.append('image_url', 'null')
      }
      
      // Log for debugging
      console.log('Submitting FormData:')
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1])
      }
      
      // Call the onSubmit function
      await onSubmit(formDataToSend)
      
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
      // Handle general error
      else if (error?.message) {
        toast.error(error.message)
        setLocalError(error.message)
      } 
      else {
        toast.error('Failed to submit form')
        setLocalError('Failed to submit form')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] isolate overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered modal container */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        {/* Modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Display global error */}
          {(localError || error) && (
            <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{localError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Image Upload Section */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Image
                </label>
                <div className="flex items-start gap-4">
                  {/* Image Preview */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                          
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-90 hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="category-image-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="category-image-upload"
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    // Clear validation error for this field when user types
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    validationErrors.name 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                  disabled={isSubmitting}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Brief description of this category..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    validationErrors.display_order 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Order number"
                  disabled={isSubmitting}
                />
                {validationErrors.display_order && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.display_order}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Items will be displayed in ascending order
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active Status (visible on menu)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  initialData ? 'Update Category' : 'Add Category'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}