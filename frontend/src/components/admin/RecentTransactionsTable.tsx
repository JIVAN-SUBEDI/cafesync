// // components/dashboard/RecentTransactionsTable.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   CreditCard, 
//   Building2, 
//   Download,
//   Eye,
//   CheckCircle,
//   XCircle,
//   Clock,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   Filter
// } from 'lucide-react';

// interface RecentTransactionsTableProps {
//   transactions: Array<{
//     id: string;
//     amount: string;
//     status: string;
//     paymentMethod: string;
//     hotelName: string;
//     hotelId: string;
//     planName: string;
//     createdAt: string;
//   }>;
// }

// export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
//   const router = useRouter();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage] = useState(5);

//   // Filter transactions
//   const filteredTransactions = transactions.filter(tx => {
//     const matchesSearch = 
//       tx.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       tx.planName.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = statusFilter === 'all' ? true : tx.status === statusFilter;
    
//     return matchesSearch && matchesStatus;
//   });

//   // Pagination
//   const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
//   const startIndex = (currentPage - 1) * rowsPerPage;
//   const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + rowsPerPage);

//   // Calculate totals
//   const totalAmount = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
//   const averageAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

//   const getStatusIcon = (status: string) => {
//     switch(status) {
//       case 'completed':
//         return <CheckCircle className="h-4 w-4 text-green-500" />;
//       case 'pending':
//         return <Clock className="h-4 w-4 text-yellow-500" />;
//       case 'failed':
//         return <XCircle className="h-4 w-4 text-red-500" />;
//       default:
//         return <CreditCard className="h-4 w-4 text-gray-500" />;
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch(status) {
//       case 'completed':
//         return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>;
//       case 'pending':
//         return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
//       case 'failed':
//         return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
//       default:
//         return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
//     }
//   };

//   const getPaymentMethodIcon = (method: string) => {
//     switch(method?.toLowerCase()) {
//       case 'card':
//       case 'credit_card':
//         return '💳';
//       case 'bank_transfer':
//         return '🏦';
//       case 'paypal':
//         return '📧';
//       default:
//         return '💰';
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleViewTransaction = (txId: string) => {
//     router.push(`/admin/transactions/${txId}`);
//   };

//   const handleViewHotel = (hotelId: string) => {
//     router.push(`/admin/hotels/${hotelId}`);
//   };

//   const handleExportTransaction = (txId: string) => {
//     console.log('Export transaction:', txId);
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
//             <p className="text-sm text-gray-500 mt-1">
//               Total: ${totalAmount.toFixed(2)} • Avg: ${averageAmount.toFixed(2)}
//             </p>
//           </div>
          
//           <div className="flex gap-3">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search transactions..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             {/* Status Filter */}
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Status</option>
//               <option value="completed">Completed</option>
//               <option value="pending">Pending</option>
//               <option value="failed">Failed</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {paginatedTransactions.map((tx) => (
//               <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                       <CreditCard className="h-5 w-5 text-purple-600" />
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">#{tx.id.slice(0,8)}</div>
//                       <div className="text-sm text-gray-500">{getPaymentMethodIcon(tx.paymentMethod)} {tx.paymentMethod || 'Card'}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <button
//                     onClick={() => handleViewHotel(tx.hotelId)}
//                     className="flex items-center text-sm text-gray-900 hover:text-blue-600"
//                   >
//                     <Building2 className="h-4 w-4 text-gray-400 mr-2" />
//                     {tx.hotelName}
//                   </button>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm text-gray-900">{tx.planName}</span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-lg font-semibold text-gray-900">${tx.amount}</span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center gap-2">
//                     {getStatusIcon(tx.status)}
//                     {getStatusBadge(tx.status)}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-right">
//                   <div className="flex items-center justify-end gap-2">
//                     <button
//                       onClick={() => handleViewTransaction(tx.id)}
//                       className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
//                       title="View Details"
//                     >
//                       <Eye className="h-4 w-4" />
//                     </button>
//                     <button
//                       onClick={() => handleExportTransaction(tx.id)}
//                       className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
//                       title="Export Receipt"
//                     >
//                       <Download className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//         <div className="text-sm text-gray-500">
//           Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </button>
//           <span className="text-sm text-gray-700">
//             Page {currentPage} of {totalPages || 1}
//           </span>
//           <button
//             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//             disabled={currentPage === totalPages || totalPages === 0}
//             className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }







// components/dashboard/RecentTransactionsTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Building2, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

interface RecentTransactionsTableProps {
  transactions?: Array<{  // Make it optional with ?
    id: string;
    orderNumber?: string;  // Add orderNumber field
    amount: string;
    status: string;
    paymentMethod?: string;
    hotelName: string;
    hotelId: string;
    planName?: string;
    waiterName?: string;    // Add waiterName field
    createdAt: string;
  }>;
}

export default function RecentTransactionsTable({ transactions = [] }: RecentTransactionsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Safe check - if transactions is undefined or empty, use empty array
  const transactionList = transactions || [];

  // Filter transactions
  const filteredTransactions = transactionList.filter(tx => {
    const matchesSearch = 
      (tx.hotelName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tx.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tx.planName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tx.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : tx.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + rowsPerPage);

  // Calculate totals
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
  const averageAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status || 'Unknown'}</span>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method?.toLowerCase()) {
      case 'card':
      case 'credit_card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'paypal':
        return '📧';
      case 'cash':
        return '💵';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewTransaction = (txId: string) => {
    router.push(`/admin/orders/${txId}`);
  };

  const handleViewHotel = (hotelId: string) => {
    router.push(`/admin/hotels/${hotelId}`);
  };

  const handleExportTransaction = (txId: string) => {
    console.log('Export transaction:', txId);
  };

  // Show loading or empty state
  if (transactionList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Transactions</h3>
          <p className="text-gray-500">There are no transactions to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-500 mt-1">
              Total: ${totalAmount.toFixed(2)} • Avg: ${averageAmount.toFixed(2)}
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tx.orderNumber || `#${tx.id.slice(0,8)}`}</div>
                      <div className="text-sm text-gray-500">{getPaymentMethodIcon(tx.paymentMethod || '')} {tx.paymentMethod || 'Card'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewHotel(tx.hotelId)}
                    className="flex items-center text-sm text-gray-900 hover:text-blue-600"
                  >
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    {tx.hotelName}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{tx.waiterName || 'N/A'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg font-semibold text-gray-900">${tx.amount}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    {getStatusBadge(tx.status)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewTransaction(tx.id)}
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExportTransaction(tx.id)}
                      className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Export Receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}