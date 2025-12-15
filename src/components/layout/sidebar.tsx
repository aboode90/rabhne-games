'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { ROUTES } from '@/lib/config'
import { clsx } from 'clsx'
import {
  Home,
  Gamepad2,
  BarChart3,
  CreditCard,
  User,
  HelpCircle,
  Settings,
  Users,
  FileText,
  DollarSign,
} from 'lucide-react'

const navigation = [
  { name: 'الرئيسية', href: ROUTES.HOME, icon: Home },
  { name: 'الألعاب', href: ROUTES.GAMES, icon: Gamepad2 },
  { name: 'لوحة التحكم', href: ROUTES.DASHBOARD, icon: BarChart3, requireAuth: true },
  { name: 'السحب', href: ROUTES.WITHDRAW, icon: CreditCard, requireAuth: true },
  { name: 'الملف الشخصي', href: ROUTES.PROFILE, icon: User, requireAuth: true },
  { name: 'الدعم', href: ROUTES.SUPPORT, icon: HelpCircle },
]

const adminNavigation = [
  { name: 'إدارة النظام', href: ROUTES.ADMIN, icon: Settings },
  { name: 'المستخدمين', href: ROUTES.ADMIN_USERS, icon: Users },
  { name: 'الألعاب', href: ROUTES.ADMIN_GAMES, icon: Gamepad2 },
  { name: 'طلبات السحب', href: ROUTES.ADMIN_WITHDRAWALS, icon: DollarSign },
  { name: 'الإعدادات', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavigation = navigation.filter(item => 
    !item.requireAuth || user
  )

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
      <div className="flex flex-col flex-grow bg-dark-800 border-r border-dark-700 pt-5 pb-4 overflow-y-auto">
        <div className="flex flex-col flex-grow">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-900/50 text-primary-300 border-r-2 border-primary-500'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'ml-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-white'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Admin Section */}
          {user?.isAdmin && (
            <div className="mt-8">
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  إدارة النظام
                </h3>
              </div>
              <nav className="px-2 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-secondary-900/50 text-secondary-300 border-r-2 border-secondary-500'
                          : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'ml-3 flex-shrink-0 h-5 w-5',
                          isActive ? 'text-secondary-400' : 'text-dark-400 group-hover:text-white'
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}