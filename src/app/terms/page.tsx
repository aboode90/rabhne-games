import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">شروط الاستخدام</h1>
          <p className="text-xl text-dark-300">
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصة ربحني جيمز
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>شروط وأحكام استخدام منصة ربحني جيمز</CardTitle>
            <p className="text-dark-400">آخر تحديث: 15 يناير 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. القبول بالشروط</h2>
                <p className="text-dark-300 leading-relaxed">
                  باستخدامك لمنصة ربحني جيمز، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
                  إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. وصف الخدمة</h2>
                <p className="text-dark-300 leading-relaxed mb-4">
                  ربحني جيمز هي منصة ألعاب إلكترونية تتيح للمستخدمين:
                </p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>لعب الألعاب المتاحة على المنصة</li>
                  <li>ربح النقاط من خلال اللعب</li>
                  <li>تحويل النقاط إلى أموال حقيقية</li>
                  <li>سحب الأرباح عبر USDT TRC20</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. التسجيل والحساب</h2>
                <div className="space-y-4 text-dark-300">
                  <p>يجب على المستخدمين:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                    <li>الحفاظ على سرية بيانات تسجيل الدخول</li>
                    <li>إشعارنا فوراً بأي استخدام غير مصرح به للحساب</li>
                    <li>أن يكونوا بعمر 18 سنة أو أكثر</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. نظام النقاط والأرباح</h2>
                <div className="space-y-4 text-dark-300">
                  <h3 className="text-lg font-medium text-white">4.1 كسب النقاط</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>يحصل المستخدم على نقطة واحدة لكل دقيقة لعب نشط</li>
                    <li>الحد الأقصى اليومي هو 2,880 نقطة</li>
                    <li>يجب أن يكون اللعب نشطاً وحقيقياً</li>
                  </ul>

                  <h3 className="text-lg font-medium text-white mt-6">4.2 تحويل النقاط</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>10,000 نقطة = 1 دولار أمريكي</li>
                    <li>الحد الأدنى للسحب: 20,000 نقطة (2 دولار)</li>
                    <li>السحب متاح عبر USDT TRC20 فقط</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. السحب والدفع</h2>
                <div className="space-y-4 text-dark-300">
                  <ul className="list-disc list-inside space-y-2">
                    <li>طلبات السحب تتم مراجعتها خلال 1-3 أيام عمل</li>
                    <li>المستخدم مسؤول عن صحة عنوان المحفظة</li>
                    <li>لا يمكن استرداد الأموال المرسلة لعنوان خاطئ</li>
                    <li>نحتفظ بالحق في رفض طلبات السحب المشبوهة</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. السلوك المقبول</h2>
                <div className="space-y-4 text-dark-300">
                  <p>يُمنع على المستخدمين:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>استخدام برامج أو أدوات للتلاعب في النظام</li>
                    <li>إنشاء حسابات متعددة</li>
                    <li>مشاركة الحساب مع أشخاص آخرين</li>
                    <li>محاولة اختراق أو تعطيل المنصة</li>
                    <li>انتهاك حقوق الملكية الفكرية</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. إنهاء الحساب</h2>
                <p className="text-dark-300 leading-relaxed">
                  نحتفظ بالحق في تعليق أو إنهاء أي حساب في حالة انتهاك هذه الشروط. 
                  في حالة الإنهاء، قد يتم مصادرة النقاط المتراكمة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. إخلاء المسؤولية</h2>
                <p className="text-dark-300 leading-relaxed">
                  المنصة مقدمة "كما هي" دون أي ضمانات. لا نتحمل المسؤولية عن أي أضرار 
                  مباشرة أو غير مباشرة قد تنتج عن استخدام المنصة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. تعديل الشروط</h2>
                <p className="text-dark-300 leading-relaxed">
                  نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين 
                  بالتغييرات المهمة عبر البريد الإلكتروني أو إشعار على المنصة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. القانون المطبق</h2>
                <p className="text-dark-300 leading-relaxed">
                  تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع ينشأ 
                  عن استخدام المنصة سيتم حله وفقاً للقوانين السعودية.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. التواصل</h2>
                <p className="text-dark-300 leading-relaxed">
                  لأي استفسارات حول هذه الشروط، يرجى التواصل معنا عبر:
                </p>
                <ul className="list-disc list-inside text-dark-300 space-y-2 mt-4">
                  <li>البريد الإلكتروني: support@rabhne.online</li>
                  <li>الموقع الإلكتروني: www.rabhne.online</li>
                </ul>
              </section>

              <div className="border-t border-dark-700 pt-8 mt-8">
                <p className="text-dark-400 text-center">
                  © 2024 ربحني جيمز. جميع الحقوق محفوظة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}