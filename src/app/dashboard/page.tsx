'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdSense } from '@/components/ads/adsense'
import { useAuth } from '@/components/auth/auth-provider'
import { ROUTES, APP_CONFIG } from '@/lib/config'
import {
  Coins,
  TrendingUp,
  Calendar,
  DollarSign,
  Play,
  Clock,
  Target,
  Award,
} from 'lucide-react'

// Mock data for transactions
const mockTransactions = [
  {
    id: '1',
    type: 'earn' as const,
    pointsDelta: 45,
    pointsBalance: 1245,
    meta: { gameId: '1', reason: 'لعب لعبة سباق السيارات الخارق' },
    createdAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    type: 'earn' as const,
    pointsDelta: 32,
    pointsBalance: 1200,
    meta: { gameId: '2', reason: 'لعب لعبة سيد الألغاز' },
    createdAt: new Date('2024-01-15T09:15:00'),
  },
  {
    id: '3',
    type: 'withdraw_lock' as const,
    pointsDelta: -20000,
    pointsBalance: 1168,
    meta: { withdrawRequestId: 'wr1', reason: 'طلب سحب $2' },
    createdAt: new Date('2024-01-14T16:45:00'),
  },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions] = useState(mockTransactions)

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  const pointsToUSD = user.points / APP_CONFIG.points.toDollarRate
  const todayProgress = (user.pointsToday / APP_CONFIG.points.dailyLimit) * 100
  const canWithdraw = user.points >= APP_CONFIG.points.minWithdraw

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            مرحباً، {user.displayName}
          </h1>
          <p className="text-dark-400">
            إليك ملخص نشاطك وأرباحك
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Points */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">إجمالي النقاط</p>
                  <p className="text-2xl font-bold text-white">
                    {user.points.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm">
                    ≈ ${pointsToUSD.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Points */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">نقاط اليوم</p>
                  <p className="text-2xl font-bold text-white">
                    {user.pointsToday}
                  </p>
                  <p className="text-blue-400 text-sm">
                    من {APP_CONFIG.points.dailyLimit}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">حالة السحب</p>
                  <p className="text-2xl font-bold text-white">
                    {canWithdraw ? 'متاح' : 'غير متاح'}
                  </p>
                  <p className="text-yellow-400 text-sm">
                    الحد الأدنى: {APP_CONFIG.points.minWithdraw.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${canWithdraw ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-gray-500 to-gray-400'}`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">تقدم اليوم</p>
                  <p className="text-2xl font-bold text-white">
                    {todayProgress.toFixed(0)}%
                  </p>
                  <p className="text-purple-400 text-sm">
                    من الحد اليومي
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 ml-2" />
              تقدم اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">النقاط المكتسبة اليوم</span>
                <span className="text-white">{user.pointsToday} / {APP_CONFIG.points.dailyLimit}</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(todayProgress, 100)}%` }}
                />
              </div>
              <p className="text-dark-400 text-sm">
                {todayProgress >= 100 
                  ? 'تهانينا! وصلت إلى الحد الأقصى اليومي' 
                  : `يمكنك ربح ${APP_CONFIG.points.dailyLimit - user.pointsToday} نقطة إضافية اليوم`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push(ROUTES.GAMES)}
                className="w-full justify-start"
              >
                <Play className="w-4 h-4 ml-2" />
                العب واربح النقاط
              </Button>
              
              <Button
                onClick={() => router.push(ROUTES.WITHDRAW)}
                disabled={!canWithdraw}
                variant="secondary"
                className="w-full justify-start"
              >
                <DollarSign className="w-4 h-4 ml-2" />
                اسحب أرباحك
              </Button>
              
              <Button
                onClick={() => router.push(ROUTES.PROFILE)}
                variant="ghost"
                className="w-full justify-start"
              >
                <Award className="w-4 h-4 ml-2" />
                الملف الشخصي
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 ml-2" />
                  المعاملات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'earn' 
                              ? 'bg-green-900/50 text-green-400' 
                              : 'bg-red-900/50 text-red-400'
                          }`}>
                            {transaction.type === 'earn' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <DollarSign className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {transaction.meta.reason}
                            </p>
                            <p className="text-dark-400 text-sm">
                              {transaction.createdAt.toLocaleDateString('ar-SA')} - {transaction.createdAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-bold ${
                            transaction.pointsDelta > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.pointsDelta > 0 ? '+' : ''}{transaction.pointsDelta.toLocaleString()}
                          </p>
                          <p className="text-dark-400 text-sm">
                            الرصيد: {transaction.pointsBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400">لا توجد معاملات بعد</p>
                    <p className="text-dark-500 text-sm">ابدأ اللعب لرؤية معاملاتك هنا</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Multiplex Ad */}
        <div className="mt-12">
          <AdSense 
            adSlot="7982264856" 
            adFormat="autorelaxed"
            style={{ display: 'block', minHeight: '200px' }}
          />
        </div>
      </div>
    </MainLayout>
  )
}