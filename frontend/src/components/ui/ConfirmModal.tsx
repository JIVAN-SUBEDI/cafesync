// // components/dashboard/modals/ConfirmModal.tsx
// 'use client'

// import React from 'react'
// import { AlertTriangle, X } from 'lucide-react'

// interface ConfirmModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onConfirm: () => void
//   title: string
//   message: string
//   confirmText?: string
//   cancelText?: string
//   variant?: 'danger' | 'warning' | 'info'
//   loading?: boolean
// }

// export default function ConfirmModal({
//   isOpen,
//   onClose,
//   onConfirm,
//   title,
//   message,
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   variant = 'danger',
//   loading = false
// }: ConfirmModalProps) {
//   if (!isOpen) return null

//   const variantClasses = {
//     danger: 'bg-red-600 hover:bg-red-700',
//     warning: 'bg-amber-600 hover:bg-amber-700',
//     info: 'bg-blue-600 hover:bg-blue-700'
//   }

//   const iconColors = {
//     danger: 'text-red-600',
//     warning: 'text-amber-600',
//     info: 'text-blue-600'
//   }

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className={`p-2 ${iconColors[variant]} bg-opacity-10 rounded-lg`}>
//               <AlertTriangle className="h-6 w-6" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//             disabled={loading}
//           >
//             <X className="h-5 w-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="p-6">
//           <p className="text-gray-600">{message}</p>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center justify-end gap-3">
//             <button
//               onClick={onClose}
//               disabled={loading}
//               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {cancelText}
//             </button>
//             <button
//               onClick={onConfirm}
//               disabled={loading}
//               className={`px-4 py-2 text-white rounded-lg font-medium ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
//             >
//               {loading && (
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//               )}
//               {confirmText}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


// components/dashboard/views/ConfirmModal.tsx
'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}