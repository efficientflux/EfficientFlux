'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  Plus,
  Download
} from 'lucide-react'

interface InventoryItem {
  id: string
  item_name: string
  sku: string
  category: string
  quantity_on_hand: number
  reorder_point: number
  unit_cost: number
  supplier: string
  location: string
  unit_of_measure: string
  last_updated: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filtered, setFiltered] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    let result = inventory

    if (search) {
      result = result.filter(item =>
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter)
    }

    setFiltered(result)
  }, [search, categoryFilter, inventory])

  const fetchInventory = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Get organization membership
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)

      console.log('memberships:', memberships)
      console.log('memberError:', memberError)
      console.log('user id:', user.id)

      if (memberError || !memberships || memberships.length === 0) {
        setError(`No organization found - userID: ${user.id} - error: ${memberError?.message}`)
        setLoading(false)
        return
      }


      const orgId = memberships[0].organization_id

      // Get inventory
      const { data, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', orgId)
        .order('item_name')

      if (invError) {
        setError(invError.message)
        setLoading(false)
        return
      }

      if (data) {
        setInventory(data)
        setFiltered(data)
        const cats = [
          ...new Set(data.map(item => item.category).filter(Boolean))
        ]
        setCategories(cats)
      }

      setLoading(false)

    } catch (err) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const getStatus = (item: InventoryItem) => {
    if (item.quantity_on_hand <= item.reorder_point) {
      return { label: 'Reorder Now', color: 'red' }
    } else if (item.quantity_on_hand <= item.reorder_point * 1.5) {
      return { label: 'Running Low', color: 'yellow' }
    }
    return { label: 'Healthy', color: 'green' }
  }

  const statusColors: Record<string, string> = {
    red:    'bg-red-900/30 text-red-400 border border-red-800',
    yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
    green:  'bg-green-900/30 text-green-400 border border-green-800',
  }

  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.quantity_on_hand * item.unit_cost), 0
  )
  const itemsToReorder = inventory.filter(
    i => i.quantity_on_hand <= i.reorder_point
  ).length
  const runningLow = inventory.filter(
    i => i.quantity_on_hand > i.reorder_point &&
         i.quantity_on_hand <= i.reorder_point * 1.5
  ).length

  const exportCSV = () => {
    const headers = [
      'Item Name', 'SKU', 'Category', 'Quantity',
      'Reorder Point', 'Unit', 'Unit Cost',
      'Total Value', 'Supplier', 'Location', 'Status'
    ]
    const rows = filtered.map(item => {
      const status = getStatus(item)
      return [
        item.item_name,
        item.sku || '',
        item.category || '',
        item.quantity_on_hand,
        item.reorder_point,
        item.unit_of_measure || '',
        item.unit_cost,
        (item.quantity_on_hand * item.unit_cost).toFixed(2),
        item.supplier || '',
        item.location || '',
        status.label
      ]
    })

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500
                        border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-900/30 border border-red-800 
                        rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">Error loading inventory</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Inventory Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track and manage your parts and supplies
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700
                     border border-gray-700 text-white text-sm font-medium
                     px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Items</p>
            <Package size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {inventory.length}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Reorder Now</p>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {itemsToReorder}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Running Low</p>
            <TrendingDown size={16} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {runningLow}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Value</p>
            <DollarSign size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2
                       text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700
                       rounded-lg pl-9 pr-4 py-2.5 text-white text-sm
                       placeholder-gray-500 focus:outline-none
                       focus:border-blue-500"
          />
        </div>

        <div className="relative">
          <Filter size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2
                       text-gray-500" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg
                       pl-9 pr-4 py-2.5 text-white text-sm
                       focus:outline-none focus:border-blue-500
                       appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          className="flex items-center gap-2 bg-blue-600
                     hover:bg-blue-700 text-white text-sm
                     font-medium px-4 py-2.5 rounded-lg
                     transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-gray-900 border border-gray-800 
                      rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  'Item', 'Category', 'Qty on Hand',
                  'Reorder Point', 'Unit Cost',
                  'Total Value', 'Supplier', 'Status'
                ].map(header => (
                  <th
                    key={header}
                    className="text-left text-xs font-medium text-gray-500
                               uppercase tracking-wider px-4 py-3"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((item) => {
                const status = getStatus(item)
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">
                        {item.item_name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm">
                        {item.quantity_on_hand} {item.unit_of_measure}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {item.reorder_point}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        ${item.unit_cost}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white text-sm font-medium">
                        ${(item.quantity_on_hand * item.unit_cost).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {item.supplier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        text-xs font-medium px-2.5 py-1 rounded-full
                        ${statusColors[status.color]}
                      `}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No items found</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-800
                        flex items-center justify-between">
          <p className="text-gray-500 text-xs">
            Showing {filtered.length} of {inventory.length} items
          </p>
          <p className="text-gray-500 text-xs">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

    </div>
  )
}

