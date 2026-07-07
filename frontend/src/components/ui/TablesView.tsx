
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

import { RootState, AppDispatch } from '@/store/index'
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} from '@/store/slices/dashboardSlice'

import TableStatus from './TableStatus'
import LoadingSpinner from './LoadingSpinner'
import ConfirmModal from './ConfirmModal'
import TableModal from './TableModal'
import useHotelAuth from '@/hooks/useHotelAuth'


export default function TablesView() {
  const dispatch = useDispatch<AppDispatch>()
const { hotelSlug, isAuthenticated, isLoading } = useHotelAuth();
  const { tablesList, loading } = useSelector((state: RootState) => state.dashboard)

  // ✅ FIX: normalize API shape {success, tables:[...]} OR direct array
  const tablesArray = useMemo(() => {
    if (Array.isArray(tablesList)) return tablesList
    if (tablesList && Array.isArray((tablesList as any).tables)) return (tablesList as any).tables
    return []
  }, [tablesList])

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] =
    useState<'all' | 'available' | 'occupied' | 'reserved' | 'cleaning'>('all')

  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState<any>(null)

  const [showDelete, setShowDelete] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated || !hotelSlug) return;
    dispatch(fetchTables());
  }, [hotelSlug, isAuthenticated, dispatch]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tablesArray.filter((t: any) => {
      const statusOk = filterStatus === 'all' || t.status === filterStatus
      const searchOk =
        !q ||
        (t.table_number || '').toLowerCase().includes(q) ||
        (t.table_name || '').toLowerCase().includes(q) ||
        (t.section || '').toLowerCase().includes(q)
      return statusOk && searchOk
    })
  }, [tablesArray, search, filterStatus])

  const stats = useMemo(() => {
    const total = tablesArray.length
    const available = tablesArray.filter((t: any) => t.status === 'available').length
    const occupied = tablesArray.filter((t: any) => t.status === 'occupied').length
    const reserved = tablesArray.filter((t: any) => t.status === 'reserved').length
    const cleaning = tablesArray.filter((t: any) => t.status === 'cleaning').length
    return { total, available, occupied, reserved, cleaning }
  }, [tablesArray])

  const handleCreate = async (tableData: any) => {
    try {
      await dispatch(createTable({ tableData })).unwrap()
      toast.success('Table created')
      setShowModal(false)
      setEditingTable(null)
    } catch (e: any) {
      toast.error(e || 'Failed to create table')
    }
  }

  const handleUpdate = async (tableData: any) => {
    if (!editingTable?.id) return
    try {
      await dispatch(updateTable({ tableId: editingTable.id, tableData })).unwrap()
      toast.success('Table updated')
      setShowModal(false)
      setEditingTable(null)
    } catch (e: any) {
      toast.error(e || 'Failed to update table')
    }
  }

  const handleDelete = async () => {
    if (!selectedTable?.id) return
    try {
      await dispatch(deleteTable({  tableId: selectedTable.id })).unwrap()
      toast.success('Table deleted')
      setShowDelete(false)
      setSelectedTable(null)
    } catch (e: any) {
      toast.error(e || 'Failed to delete table')
    }
  }

  const changeStatus = async (tableId: string, status: any) => {
    try {
      await dispatch(updateTableStatus({ tableId, status })).unwrap()
      toast.success('Status updated')
    } catch (e: any) {
      toast.error(e || 'Failed to update status')
    }
  }

  if (loading && tablesArray.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-2">Table Management</h1>
            <p className="text-blue-100">Manage your hotel tables and seating</p>
          </div>
          <button
            onClick={() => {
              setEditingTable(null)
              setShowModal(true)
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total', stats.total],
          ['Available', stats.available],
          ['Occupied', stats.occupied],
  
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value as number}</p>
          </div>
        ))}
      </div>

      <TableStatus tables={tablesArray} />

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by number / name / section..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>

            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredTables.length}</span> of{' '}
            <span className="font-medium">{tablesArray.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Tables</h3>
          <p className="text-sm text-gray-600">Edit table details and update status</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Table</th>
                <th className="p-4 font-medium">Section</th>
                <th className="p-4 font-medium">Floor</th>
                <th className="p-4 font-medium">Capacity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTables.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{t.table_number}</p>
                    {t.table_name && <p className="text-sm text-gray-600">{t.table_name}</p>}
                  </td>

                  <td className="p-4">
                    <p className="text-sm text-gray-700">{t.section || '—'}</p>
                  </td>

                  <td className="p-4">
                    <p className="text-sm text-gray-700">{t.floor_number ?? '—'}</p>
                  </td>

                  <td className="p-4">
                    <p className="text-sm text-gray-700">{t.capacity} seats</p>
                  </td>

                  <td className="p-4">
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
      
                    </select>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTable(t)
                          setShowModal(true)
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTable(t)
                          setShowDelete(true)
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTables.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-600">No tables found.</p>
              <button
                onClick={() => {
                  setEditingTable(null)
                  setShowModal(true)
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first table
              </button>
            </div>
          )}
        </div>
      </div>

      <TableModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingTable(null)
        }}
        onSubmit={editingTable ? handleUpdate : handleCreate}
        initialData={editingTable}
        // hotelSlug={hotelSlug}
      />

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false)
          setSelectedTable(null)
        }}
        onConfirm={handleDelete}
        title="Delete Table"
        message={`Are you sure you want to delete ${selectedTable?.table_number || ''}? This action cannot be undone.`}
      />
    </div>
  )
}
