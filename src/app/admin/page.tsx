'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Gamepad2, DollarSign, Settings } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalGames: number
  pendingWithdrawals: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalGames: 0,
    pendingWithdrawals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        // Get total games (mock data count)
        const totalGames = 50 // From MOCK_GAMES

        // Get pending withdrawals
        const withdrawalsQuery = query(
          collection(db, 'withdrawals'),
          where('status', '==', 'pending')
        )
        const withdrawalsSnapshot = await getDocs(withdrawalsQuery)
        const pendingWithdrawals = withdrawalsSnapshot.size

        setStats({ totalUsers, totalGames, pendingWithdrawals })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">لوحة الإدارة</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 ml-2" />
                المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-dark-400 text-sm">إجمالي المستخدمين</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gamepad2 className="w-5 h-5 ml-2" />
                الألعاب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : stats.totalGames.toLocaleString()}
              </p>
              <p className="text-dark-400 text-sm">إجمالي الألعاب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 ml-2" />
                طلبات السحب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : stats.pendingWithdrawals.toLocaleString()}
              </p>
              <p className="text-dark-400 text-sm">طلبات معلقة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 ml-2" />
                الإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">نشط</p>
              <p className="text-dark-400 text-sm">حالة النظام</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}