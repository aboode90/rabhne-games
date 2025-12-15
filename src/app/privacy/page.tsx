import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">سياسة الخصوصية</h1>
          <p className="text-xl text-dark-300">
            نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سياسة الخصوصية لمنصة ربحني جيمز</CardTitle>
            <p className="text-dark-400">آخر تحديث: 15 يناير 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. مقدمة</h2>
                <p className="text-dark-300 leading-relaxed">
                  تصف هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها 
                  عند استخدام منصة ربحني جيمز. نحن ملتزمون بحماية خصوصيتك وضمان أمان بياناتك.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. المعلومات التي نجمعها</h2>
                
                <h3 className="text-lg font-medium text-white mb-3">2.1 المعلومات الشخصية</h3>
                <ul className="list-disc list-inside text-dark-300 space-y-2 mb-4">
                  <li>الاسم والبريد الإلكتروني</li>
                  <li>معلومات الحساب (اسم المستخدم، كلمة المرور)</li>
                  <li>عنوان محفظة USDT TRC20 للسحب</li>
                  <li>تاريخ التسجيل وآخر تسجيل دخول</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">2.2 معلومات الاستخدام</h3>
                <ul className="list-disc list-inside text-dark-300 space-y-2 mb-4">
                  <li>سجل الألعاب المُلعبة ومدة اللعب</li>
                  <li>النقاط المكتسبة والمعاملات</li>
                  <li>طلبات السحب وحالتها</li>
                  <li>عنوان IP وبيانات المتصفح</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">2.3 ملفات تعريف الارتباط</h3>
                <p className="text-dark-300 leading-relaxed">
                  نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وحفظ تفضيلاتك.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. كيفية استخدام المعلومات</h2>
                <p className="text-dark-300 leading-relaxed mb-4">نستخدم المعلومات المجمعة للأغراض التالية:</p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>تقديم وتحسين خدماتنا</li>
                  <li>إدارة حسابات المستخدمين</li>
                  <li>معالجة طلبات السحب</li>
                  <li>منع الاحتيال والتلاعب</li>
                  <li>التواصل مع المستخدمين</li>
                  <li>الامتثال للمتطلبات القانونية</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. مشاركة المعلومات</h2>
                <p className="text-dark-300 leading-relaxed mb-4">
                  نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة، باستثناء:
                </p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>عند الحصول على موافقتك الصريحة</li>
                  <li>لمعالجة طلبات السحب (مع مقدمي خدمات الدفع)</li>
                  <li>للامتثال للقوانين أو الأوامر القضائية</li>
                  <li>لحماية حقوقنا أو سلامة المستخدمين</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. أمان البيانات</h2>
                <p className="text-dark-300 leading-relaxed mb-4">
                  نتخذ تدابير أمنية متقدمة لحماية معلوماتك:
                </p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>تشفير البيانات الحساسة</li>
                  <li>استخدام بروتوكولات HTTPS الآمنة</li>
                  <li>مراقبة النشاط المشبوه</li>
                  <li>تحديث أنظمة الأمان بانتظام</li>
                  <li>تقييد الوصول للبيانات</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. حقوقك</h2>
                <p className="text-dark-300 leading-relaxed mb-4">لديك الحق في:</p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>الوصول إلى معلوماتك الشخصية</li>
                  <li>تصحيح المعلومات غير الدقيقة</li>
                  <li>طلب حذف حسابك وبياناتك</li>
                  <li>الاعتراض على معالجة بياناتك</li>
                  <li>نقل بياناتك إلى خدمة أخرى</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. الاحتفاظ بالبيانات</h2>
                <p className="text-dark-300 leading-relaxed">
                  نحتفظ بمعلوماتك طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات. 
                  بعد حذف الحساب، قد نحتفظ ببعض المعلومات للامتثال القانوني أو لأغراض الأمان.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. خدمات الطرف الثالث</h2>
                <div className="space-y-4 text-dark-300">
                  <h3 className="text-lg font-medium text-white">8.1 Firebase (Google)</h3>
                  <p>نستخدم Firebase لإدارة المصادقة وقاعدة البيانات. تخضع لسياسة خصوصية Google.</p>
                  
                  <h3 className="text-lg font-medium text-white">8.2 Vercel</h3>
                  <p>نستخدم Vercel لاستضافة المنصة. تخضع لسياسة خصوصية Vercel.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. المستخدمون القُصر</h2>
                <p className="text-dark-300 leading-relaxed">
                  منصتنا مخصصة للمستخدمين بعمر 18 سنة فأكثر. لا نجمع معلومات من الأطفال 
                  دون سن 18 عاماً عمداً. إذا علمنا بجمع معلومات من قاصر، سنحذفها فوراً.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. التغييرات على السياسة</h2>
                <p className="text-dark-300 leading-relaxed">
                  قد نحدث هذه السياسة من وقت لآخر. سنشعرك بأي تغييرات مهمة عبر البريد 
                  الإلكتروني أو إشعار على المنصة. استمرار استخدامك للمنصة يعني موافقتك على التغييرات.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. التواصل معنا</h2>
                <p className="text-dark-300 leading-relaxed mb-4">
                  إذا كان لديك أي أسئلة حول سياسة الخصوصية أو تريد ممارسة حقوقك، 
                  يرجى التواصل معنا:
                </p>
                <ul className="list-disc list-inside text-dark-300 space-y-2">
                  <li>البريد الإلكتروني: privacy@rabhne.online</li>
                  <li>البريد الإلكتروني العام: support@rabhne.online</li>
                  <li>الموقع الإلكتروني: www.rabhne.online</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. القانون المطبق</h2>
                <p className="text-dark-300 leading-relaxed">
                  تخضع هذه السياسة لقوانين المملكة العربية السعودية ولوائح حماية البيانات المعمول بها.
                </p>
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