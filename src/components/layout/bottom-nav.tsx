'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { ROUTES } from '@/lib/config'
import { clsx } from 'clsx'
import {
  Gamepad2,
  Coins,
  BarChart3,
  User,
} from 'lucide-react'

const bottomNavigation = [
  { name: 'الألعاب', href: ROUTES.GAMES, icon: Gamepad2 },
  { name: 'عروض الربح', href: ROUTES.OFFERS, icon: Coins },
  { name: 'لوحة التحكم', href: ROUTES.DASHBOARD, icon: BarChart3, requireAuth: true },
  { name: 'الملف الشخصي', href: ROUTES.PROFILE, icon: User, requireAuth: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavigation = bottomNavigation.filter(item => 
    !item.requireAuth || user
  )

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bottom-nav z-50">
      <nav className="flex justify-around items-center h-16 px-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                isActive
                  ? 'text-primary-400'
                  : 'text-dark-400 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}