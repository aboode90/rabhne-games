import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

export default function AdminUsersPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">إدارة المستخدمين</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Users className="w-16 h-16" />}
              title="لا يوجد مستخدمين"
              description="سيظهر المستخدمون هنا عند التسجيل"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}