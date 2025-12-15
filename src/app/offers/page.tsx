'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gift, Star, Coins } from 'lucide-react'

export default function OffersPage() {
  const { user } = useAuth()
  const [playerId, setPlayerId] = useState<string>('')

  useEffect(() => {
    if (user) {
      setPlayerId(user.uid)
    }
  }, [user])

  const offerwallUrl = `https://reward-me.eu/68bbf3ce-d8bc-11f0-8770-c2a106037d45${playerId ? `?player_id=${playerId}` : ''}`

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            <Gift className="inline-block w-10 h-10 ml-3 text-yellow-400" />
            عروض الربح
          </h1>
          <p className="text-xl text-dark-300">
            أكمل المهام واربح نقاط إضافية مجاناً!
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">نقاط مضاعفة</h3>
              <p className="text-dark-400">اربح نقاط أكثر من المهام والعروض</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">مهام متنوعة</h3>
              <p className="text-dark-400">تطبيقات، استطلاعات، وعروض مختلفة</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">مكافآت فورية</h3>
              <p className="text-dark-400">احصل على النقاط فور إكمال المهام</p>
            </CardContent>
          </Card>
        </div>

        {/* Offerwall */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">جدار العروض</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user ? (
              <div className="relative" style={{ minHeight: '600px' }}>
                <iframe
                  src={offerwallUrl}
                  sandbox="allow-top-navigation allow-scripts allow-same-origin allow-popups allow-forms"
                  style={{
                    width: '100%',
                    minHeight: '600px',
                    border: 'none',
                    borderRadius: '0 0 12px 12px'
                  }}
                  title="عروض الربح"
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <Gift className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">
                  سجل دخولك لرؤية العروض
                </h3>
                <p className="text-dark-400 mb-6">
                  تحتاج لتسجيل الدخول للوصول إلى عروض الربح الحصرية
                </p>
                <Button onClick={() => window.location.href = '/login'}>
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>كيفية الربح من العروض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">خطوات الربح:</h4>
                <ol className="list-decimal list-inside text-dark-300 space-y-2">
                  <li>اختر عرض من القائمة أعلاه</li>
                  <li>أكمل المهمة المطلوبة (تحميل تطبيق، استطلاع، إلخ)</li>
                  <li>انتظر تأكيد إكمال المهمة</li>
                  <li>احصل على النقاط في حسابك تلقائياً</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">نصائح مهمة:</h4>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>أكمل المهام بصدق للحصول على النقاط</li>
                  <li>لا تستخدم VPN أو بروكسي</li>
                  <li>انتظر وصول النقاط (قد يستغرق دقائق)</li>
                  <li>تواصل مع الدعم في حالة عدم وصول النقاط</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}