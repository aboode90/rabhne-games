'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/config'
import { 
  User, 
  LogOut, 
  Settings, 
  Coins,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-dark-800/95 backdrop-blur-sm border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-white">ربحني جيمز</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
            <Link 
              href={ROUTES.HOME}
              className="text-dark-300 hover:text-white transition-colors"
            >
              الرئيسية
            </Link>
            <Link 
              href={ROUTES.GAMES}
              className="text-dark-300 hover:text-white transition-colors"
            >
              الألعاب
            </Link>
            <Link 
              href={ROUTES.SUPPORT}
              className="text-dark-300 hover:text-white transition-colors"
            >
              الدعم
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {user ? (
              <>
                {/* Points Display */}
                <div className="hidden sm:flex items-center space-x-2 space-x-reverse bg-dark-700 rounded-lg px-3 py-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">{user.points.toLocaleString()}</span>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 space-x-reverse text-white hover:text-primary-400 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:block">{user.displayName}</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-xl border border-dark-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link
                        href={ROUTES.DASHBOARD}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>لوحة التحكم</span>
                      </Link>
                      <Link
                        href={ROUTES.PROFILE}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>الملف الشخصي</span>
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href={ROUTES.ADMIN}
                          className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>إدارة النظام</span>
                          <Badge variant="info" size="sm">Admin</Badge>
                        </Link>
                      )}
                      <hr className="my-2 border-dark-700" />
                      <button
                        onClick={signOut}
                        className="flex items-center space-x-2 space-x-reverse w-full px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              !loading && (
                <Link href={ROUTES.LOGIN}>
                  <Button variant="primary" size="sm">
                    تسجيل الدخول
                  </Button>
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-700">
            <nav className="flex flex-col space-y-2">
              <Link 
                href={ROUTES.HOME}
                className="text-dark-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link 
                href={ROUTES.GAMES}
                className="text-dark-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الألعاب
              </Link>
              <Link 
                href={ROUTES.SUPPORT}
                className="text-dark-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الدعم
              </Link>
              {user && (
                <>
                  <hr className="my-2 border-dark-700" />
                  <div className="flex items-center space-x-2 space-x-reverse py-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{user.points.toLocaleString()} نقطة</span>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}