'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Gamepad2, Plus } from 'lucide-react'

export default function AdminGamesPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">إدارة الألعاب</h1>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إضافة لعبة
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>قائمة الألعاب</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Gamepad2 className="w-16 h-16" />}
              title="لا توجد ألعاب"
              description="أضف ألعاب جديدة لتظهر هنا"
              action={{
                label: 'إضافة لعبة',
                onClick: () => console.log('Add game')
              }}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}