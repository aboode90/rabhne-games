import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/lib/config'
import {
  Gamepad2,
  Coins,
  Users,
  Trophy,
  Star,
  Play,
  ArrowLeft,
} from 'lucide-react'

const stats = [
  { name: 'إجمالي الألعاب', value: '50+', icon: Gamepad2 },
  { name: 'النقاط الموزعة', value: '1M+', icon: Coins },
  { name: 'المستخدمين النشطين', value: '10K+', icon: Users },
  { name: 'الجوائز المدفوعة', value: '$5K+', icon: Trophy },
]

const features = [
  {
    name: 'ألعاب متنوعة',
    description: 'مجموعة كبيرة من الألعاب المسلية في جميع الفئات',
    icon: Gamepad2,
  },
  {
    name: 'ربح حقيقي',
    description: 'اربح نقاط حقيقية يمكن تحويلها إلى أموال',
    icon: Coins,
  },
  {
    name: 'سحب سريع',
    description: 'اسحب أرباحك بسهولة عبر USDT TRC20',
    icon: Trophy,
  },
  {
    name: 'أمان عالي',
    description: 'نظام أمان متقدم لحماية حسابك ونقاطك',
    icon: Star,
  },
]

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center lg:text-right">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">مرحباً بك في</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                    ربحني جيمز
                  </span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-dark-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  العب واربح! منصة الألعاب العربية الأولى التي تتيح لك ربح النقاط الحقيقية من خلال لعب الألعاب المسلية
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center lg:justify-start md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href={ROUTES.GAMES}>
                      <Button size="lg" className="w-full sm:w-auto">
                        <Play className="ml-2 h-5 w-5" />
                        ابدأ اللعب الآن
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:mr-3">
                    <Link href={ROUTES.SUPPORT}>
                      <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                        تعرف على المزيد
                        <ArrowLeft className="mr-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-dark-800/50 rounded-2xl p-8 mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="h-8 w-8 text-primary-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-dark-400">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              لماذا تختار ربحني جيمز؟
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-dark-300">
              نوفر لك تجربة لعب فريدة مع إمكانية الربح الحقيقي
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.name} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-dark-400 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-12 bg-dark-800/30 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              كيف يعمل النظام؟
            </h2>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">سجل دخولك</h3>
                <p className="text-dark-400">
                  سجل دخولك باستخدام حساب Google أو البريد الإلكتروني
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">العب واربح</h3>
                <p className="text-dark-400">
                  العب الألعاب واربح نقطة واحدة كل دقيقة لعب
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">اسحب أرباحك</h3>
                <p className="text-dark-400">
                  اسحب نقاطك كأموال حقيقية عبر USDT TRC20
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href={ROUTES.LOGIN}>
              <Button size="lg">
                ابدأ الآن مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}