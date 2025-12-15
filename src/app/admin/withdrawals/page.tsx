import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DollarSign } from 'lucide-react'

export default function AdminWithdrawalsPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">طلبات السحب</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>طلبات السحب المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<DollarSign className="w-16 h-16" />}
              title="لا توجد طلبات سحب"
              description="ستظهر طلبات السحب هنا عند إرسالها"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}