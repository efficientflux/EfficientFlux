'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Brain
} from 'lucide-react'

interface DashboardStats {
  totalAssets: number
  totalInventoryItems: number
  itemsToReorder: number
  unreadInsights: number
  totalInventoryValue: number
  assetsInMaintenance: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    totalInventoryItems: 0,
    itemsToReorder: 0,
    unreadInsights: 0,
    totalInventoryValue: 0,
    assetsInMaintenance: 0
  })
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(name)')
        .eq('user_id', user.id)
        .single()

      if (!membership) return

      const orgId = membership.organization_id
      const org = membership.organizations as { name: string }
      setCompanyName(org.name)

      // Fetch assets
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('organization_id', orgId)

      // Fetch inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', orgId)

      // Fetch unread insights
      const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_read', false)

      // Calculate stats
      const totalAssets = assets?.length || 0
      const assetsInMaintenance = assets?.filter(
        a => a.status === 'maintenance'
      ).length || 0
      const totalInventoryItems = inventory?.length || 0
      const itemsToReorder = inventory?.filter(
        i => i.quantity_on_hand <= i.reorder_point
      ).length || 0
      const totalInventoryValue = inventory?.reduce(
        (sum, item) => sum + (item.quantity_on_hand * item.unit_cost), 0
      ) || 0
      const unreadInsights = insights?.length || 0

      setStats({
        totalAssets,
        totalInventoryItems,
        itemsToReorder,
        unreadInsights,
        totalInventoryValue,
        assetsInMaintenance
      })

      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Total Assets',
      value: stats.totalAssets,
      icon: Activity,
      color: 'blue',
      description: `${stats.assetsInMaintenance} in maintenance`
    },
    {
      title: 'Inventory Items',
      value: stats.totalInventoryItems,
      icon: Package,
      color: 'purple',
      description: 'Total tracked items'
    },
    {
      title: 'Items to Reorder',
      value: stats.itemsToReorder,
      icon: AlertTriangle,
      color: stats.itemsToReorder > 0 ? 'red' : 'green',
      description: stats.itemsToReorder > 0
        ? 'Needs immediate attention'
        : 'All stock levels healthy'
    },
    {
      title: 'Inventory Value',
      value: `$${stats.totalInventoryValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      icon: TrendingUp,
      color: 'green',
      description: 'Total stock value'
    },
    {
      title: 'AI Insights',
      value: stats.unreadInsights,
      icon: Brain,
      color: 'yellow',
      description: 'Unread recommendations'
    },
    {
      title: 'Assets Healthy',
      value: stats.totalAssets - stats.assetsInMaintenance,
      icon: CheckCircle,
      color: 'green',
      description: 'Operating normally'
    },
  ]

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-900/30 border-blue-800 text-blue-400',
    purple: 'bg-purple-900/30 border-purple-800 text-purple-400',
    red:    'bg-red-900/30 border-red-800 text-red-400',
    green:  'bg-green-900/30 border-green-800 text-green-400',
    yellow: 'bg-yellow-900/30 border-yellow-800 text-yellow-400',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent 
                          rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back 👋
        </h1>
        <p className="text-gray-400 mt-1">
          Here is your operations overview for{' '}
          <span className="text-blue-400 font-medium">{companyName}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`
              rounded-xl border p-5 
              ${colorMap[card.color]}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-400 font-medium">
                {card.title}
              </p>
              <card.icon size={18} className="opacity-70" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {card.value}
            </p>
            <p className="text-xs text-gray-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Inventory',    href: '/dashboard/inventory',         color: 'blue' },
            { label: 'Procurement',       href: '/dashboard/procurement',        color: 'purple' },
            { label: 'Maintenance',       href: '/dashboard/maintenance',        color: 'yellow' },
            { label: 'AI Insights',       href: '/dashboard/ai-insights',        color: 'green' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700
                         rounded-lg p-3 text-center transition-colors"
            >
              <p className="text-white text-sm font-medium">
                {action.label}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      {stats.itemsToReorder > 0 && (
        <div className="bg-red-900/20 border border-red-800 
                        rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium text-sm">
              Action Required
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {stats.itemsToReorder} inventory{' '}
              {stats.itemsToReorder === 1 ? 'item needs' : 'items need'}{' '}
              to be reordered immediately.{' '}
              <a href="/dashboard/inventory" 
                 className="text-red-300 underline">
                View inventory
              </a>
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

