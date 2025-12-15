import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-500 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">الصفحة غير موجودة</h2>
          <p className="text-dark-400 text-lg">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
          
          <a 
            href="javascript:history.back()"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-dark-600 hover:border-dark-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للخلف
          </a>
        </div>
      </div>
    </MainLayout>
  )
}