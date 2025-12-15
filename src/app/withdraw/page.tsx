'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { ROUTES, APP_CONFIG } from '@/lib/config'
import { WithdrawRequest } from '@/types'
import toast from 'react-hot-toast'
import {
  DollarSign,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react'

// Mock withdraw requests
const mockWithdrawRequests: WithdrawRequest[] = [
  {
    id: 'wr1',
    uid: 'user1',
    walletTRC20: 'TXYZabcd1234567890',
    amountUSDT: 2.0,
    pointsCost: 20000,
    status: 'pending',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: 'wr2',
    uid: 'user1',
    walletTRC20: 'TXYZabcd1234567890',
    amountUSDT: 5.0,
    pointsCost: 50000,
    status: 'paid',
    createdAt: new Date('2024-01-10T14:20:00'),
    updatedAt: new Date('2024-01-12T09:15:00'),
    processedAt: new Date('2024-01-12T09:15:00'),
    txHash: '0x1234567890abcdef',
  },
]

export default function WithdrawPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [withdrawRequests] = useState(mockWithdrawRequests)
  const [formData, setFormData] = useState({
    walletTRC20: '',
    amountUSDT: '',
  })
  const [formLoading, setFormLoading] = useState(false)

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

  const canWithdraw = user.points >= APP_CONFIG.points.minWithdraw
  const maxWithdrawUSDT = Math.floor(user.points / APP_CONFIG.points.toDollarRate)

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const amountUSDT = parseFloat(formData.amountUSDT)
      const pointsCost = amountUSDT * APP_CONFIG.points.toDollarRate

      // Validation
      if (!formData.walletTRC20.trim()) {
        toast.error('يرجى إدخال عنوان المحفظة')
        return
      }

      if (!formData.walletTRC20.startsWith('T') || formData.walletTRC20.length !== 34) {
        toast.error('عنوان المحفظة غير صحيح (يجب أن يبدأ بـ T ويكون 34 حرف)')
        return
      }

      if (amountUSDT < APP_CONFIG.withdraw.minAmount) {
        toast.error(`الحد الأدنى للسحب هو $${APP_CONFIG.withdraw.minAmount}`)
        return
      }

      if (amountUSDT > maxWithdrawUSDT) {
        toast.error(`المبلغ أكبر من رصيدك المتاح ($${maxWithdrawUSDT})`)
        return
      }

      if (pointsCost > user.points) {
        toast.error('رصيد النقاط غير كافي')
        return
      }

      // In Phase 2, this would call a Cloud Function
      // For now, just show success message
      toast.success('تم إرسال طلب السحب بنجاح! سيتم مراجعته خلال 1-3 أيام عمل')
      
      // Reset form
      setFormData({ walletTRC20: '', amountUSDT: '' })

    } catch (error) {
      console.error('Withdraw error:', error)
      toast.error('حدث خطأ أثناء إرسال طلب السحب')
    } finally {
      setFormLoading(false)
    }
  }

  const getStatusBadge = (status: WithdrawRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">قيد المراجعة</Badge>
      case 'approved':
        return <Badge variant="info">تم الموافقة</Badge>
      case 'paid':
        return <Badge variant="success">تم الدفع</Badge>
      case 'rejected':
        return <Badge variant="danger">مرفوض</Badge>
      case 'cancelled':
        return <Badge variant="default">ملغي</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const getStatusIcon = (status: WithdrawRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'approved':
        return <Info className="w-4 h-4 text-blue-400" />
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'rejected':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">سحب الأرباح</h1>
          <p className="text-dark-400">
            اسحب نقاطك كأموال حقيقية عبر USDT TRC20
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdraw Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="w-5 h-5 ml-2" />
                  طلب سحب جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canWithdraw ? (
                  <form onSubmit={handleWithdraw} className="space-y-6">
                    {/* Wallet Address */}
                    <div>
                      <label htmlFor="wallet" className="block text-sm font-medium text-white mb-2">
                        عنوان محفظة USDT TRC20
                      </label>
                      <input
                        id="wallet"
                        type="text"
                        required
                        value={formData.walletTRC20}
                        onChange={(e) => setFormData(prev => ({ ...prev, walletTRC20: e.target.value }))}
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="TXYZabcd1234567890..."
                      />
                      <p className="text-dark-400 text-sm mt-1">
                        تأكد من صحة العنوان - لا يمكن استرداد الأموال المرسلة لعنوان خاطئ
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
                        المبلغ بالدولار (USDT)
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={APP_CONFIG.withdraw.minAmount}
                        max={maxWithdrawUSDT}
                        required
                        value={formData.amountUSDT}
                        onChange={(e) => setFormData(prev => ({ ...prev, amountUSDT: e.target.value }))}
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="2.00"
                      />
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-dark-400">
                          الحد الأدنى: ${APP_CONFIG.withdraw.minAmount}
                        </span>
                        <span className="text-dark-400">
                          الحد الأقصى: ${maxWithdrawUSDT}
                        </span>
                      </div>
                    </div>

                    {/* Cost Calculation */}
                    {formData.amountUSDT && (
                      <div className="p-4 bg-dark-700/50 rounded-lg">
                        <h4 className="font-medium text-white mb-2">تفاصيل الطلب</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-dark-400">المبلغ:</span>
                            <span className="text-white">${parseFloat(formData.amountUSDT || '0').toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-400">تكلفة النقاط:</span>
                            <span className="text-white">
                              {(parseFloat(formData.amountUSDT || '0') * APP_CONFIG.points.toDollarRate).toLocaleString()} نقطة
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-400">الرصيد المتبقي:</span>
                            <span className="text-white">
                              {(user.points - (parseFloat(formData.amountUSDT || '0') * APP_CONFIG.points.toDollarRate)).toLocaleString()} نقطة
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      loading={formLoading}
                      className="w-full"
                    >
                      <DollarSign className="w-4 h-4 ml-2" />
                      إرسال طلب السحب
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      رصيد النقاط غير كافي
                    </h3>
                    <p className="text-dark-400 mb-4">
                      تحتاج إلى {APP_CONFIG.points.minWithdraw.toLocaleString()} نقطة على الأقل للسحب
                    </p>
                    <p className="text-dark-400 mb-6">
                      رصيدك الحالي: {user.points.toLocaleString()} نقطة
                    </p>
                    <Button onClick={() => router.push(ROUTES.GAMES)}>
                      العب واربح المزيد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle>رصيدك</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {user.points.toLocaleString()}
                  </p>
                  <p className="text-dark-400 text-sm">نقطة</p>
                  <p className="text-green-400 font-medium">
                    ≈ ${(user.points / APP_CONFIG.points.toDollarRate).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Withdraw Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات السحب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">الحد الأدنى:</span>
                  <span className="text-white">${APP_CONFIG.withdraw.minAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">الحد الأقصى:</span>
                  <span className="text-white">${APP_CONFIG.withdraw.maxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">وقت المعالجة:</span>
                  <span className="text-white">{APP_CONFIG.withdraw.processingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">الشبكة:</span>
                  <span className="text-white">USDT TRC20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">الرسوم:</span>
                  <span className="text-green-400">مجاناً</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdraw History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 ml-2" />
              سجل طلبات السحب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawRequests.length > 0 ? (
              <div className="space-y-4">
                {withdrawRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="text-white font-medium">
                          ${request.amountUSDT.toFixed(2)} USDT
                        </p>
                        <p className="text-dark-400 text-sm">
                          {request.createdAt.toLocaleDateString('ar-SA')} - {request.createdAt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-dark-500 text-xs">
                          {request.walletTRC20.slice(0, 10)}...{request.walletTRC20.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      {getStatusBadge(request.status)}
                      <p className="text-dark-400 text-sm mt-1">
                        {request.pointsCost.toLocaleString()} نقطة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-400">لا توجد طلبات سحب بعد</p>
                <p className="text-dark-500 text-sm">طلبات السحب ستظهر هنا</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}