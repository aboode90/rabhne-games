import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdSense } from '@/components/ads/adsense'
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Clock,
  DollarSign,
  Shield,
  Gamepad2,
} from 'lucide-react'

const faqs = [
  {
    question: 'كيف أربح النقاط؟',
    answer: 'تربح نقطة واحدة كل دقيقة لعب في أي لعبة متاحة على المنصة. الحد الأقصى اليومي هو 2880 نقطة.',
  },
  {
    question: 'كيف أسحب أرباحي؟',
    answer: 'يمكنك سحب أرباحك عبر USDT TRC20 بحد أدنى 20,000 نقطة (2 دولار). الطلبات تتم معالجتها خلال 1-3 أيام عمل.',
  },
  {
    question: 'هل الموقع آمن؟',
    answer: 'نعم، نستخدم أحدث تقنيات الأمان وتشفير البيانات لحماية حسابك ونقاطك.',
  },
  {
    question: 'ما هو معدل تحويل النقاط؟',
    answer: '10,000 نقطة = 1 دولار أمريكي. هذا المعدل ثابت ولا يتغير.',
  },
  {
    question: 'لماذا لا أستطيع ربح المزيد من النقاط؟',
    answer: 'هناك حد أقصى يومي قدره 2880 نقطة لضمان العدالة ومنع التلاعب.',
  },
  {
    question: 'كم من الوقت يستغرق معالجة طلب السحب؟',
    answer: 'طلبات السحب تتم مراجعتها ومعالجتها خلال 1-3 أيام عمل.',
  },
]

export default function SupportPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">مركز المساعدة</h1>
          <p className="text-xl text-dark-300">
            نحن هنا لمساعدتك! اعثر على إجابات لأسئلتك أو تواصل معنا
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">البريد الإلكتروني</h3>
              <p className="text-dark-400 mb-4">تواصل معنا عبر البريد الإلكتروني</p>
              <Button variant="ghost" size="sm">
                support@rabhne.online
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">الدردشة المباشرة</h3>
              <p className="text-dark-400 mb-4">دردشة فورية مع فريق الدعم</p>
              <Button variant="ghost" size="sm">
                قريباً
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">أوقات العمل</h3>
              <p className="text-dark-400 mb-4">نرد خلال 24 ساعة</p>
              <Button variant="ghost" size="sm">
                24/7
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <HelpCircle className="w-6 h-6 ml-3" />
              الأسئلة الشائعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <div className="border-b border-dark-700 pb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-dark-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                  {index === 2 && (
                    <div className="my-8">
                      <AdSense 
                        adSlot="6130767765" 
                        adFormat="fluid"
                        adLayout="in-article"
                        style={{ display: 'block', textAlign: 'center', minHeight: '100px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Help Topics */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">مواضيع المساعدة السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hover className="cursor-pointer">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">الألعاب</h3>
                <p className="text-dark-400 text-sm">كيفية لعب الألعاب وربح النقاط</p>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">السحب</h3>
                <p className="text-dark-400 text-sm">كيفية سحب أرباحك</p>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">الأمان</h3>
                <p className="text-dark-400 text-sm">حماية حسابك ونقاطك</p>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer">
              <CardContent className="p-6 text-center">
                <HelpCircle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">عام</h3>
                <p className="text-dark-400 text-sm">أسئلة عامة حول المنصة</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Form */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>تواصل معنا</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    الاسم
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="اسمك الكامل"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                  الموضوع
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">اختر الموضوع</option>
                  <option value="games">مشكلة في الألعاب</option>
                  <option value="points">مشكلة في النقاط</option>
                  <option value="withdraw">مشكلة في السحب</option>
                  <option value="account">مشكلة في الحساب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  الرسالة
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              <Button type="submit" className="w-full">
                <Mail className="w-4 h-4 ml-2" />
                إرسال الرسالة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}