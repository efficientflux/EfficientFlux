'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  Wrench,
  Brain,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard',           href: '/dashboard',                    icon: LayoutDashboard },
  { name: 'Inventory',           href: '/dashboard/inventory',          icon: Package },
  { name: 'Procurement',         href: '/dashboard/procurement',        icon: ShoppingCart },
  { name: 'Transportation',      href: '/dashboard/transportation',     icon: Truck },
  { name: 'Predictive Supply',   href: '/dashboard/predictive-supply',  icon: TrendingUp },
  { name: 'Maintenance',         href: '/dashboard/maintenance',        icon: Wrench },
  { name: 'AI Insights',         href: '/dashboard/ai-insights',        icon: Brain },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')

      // Get organization name
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organizations(name)')
        .eq('user_id', user.id)
        .single()

      if (membership?.organizations) {
        const org = membership.organizations as { name: string }
        setCompanyName(org.name)
      }
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const currentPage = navigation.find(item => item.href === pathname)

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 
                        border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">
            Efficient<span className="text-blue-500">Flux</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Company Name */}
        {companyName && (
          <div className="px-6 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Organization
            </p>
            <p className="text-sm text-blue-400 font-medium mt-0.5">
              {companyName}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-colors group
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon size={18} />
                {item.name}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto" />
                )}
              </a>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 
                            flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {userEmail}
              </p>
              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full
                       text-gray-400 hover:text-white hover:bg-gray-800
                       rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 
                           flex items-center gap-4 px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-white font-semibold">
              {currentPage?.name || 'Dashboard'}
            </h2>
            <p className="text-gray-500 text-xs">
              {companyName || 'EfficientFlux'}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}

