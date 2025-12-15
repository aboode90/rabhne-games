'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

interface User {
  uid: string
  email: string
  displayName: string
  points: number
  status: string
  isAdmin: boolean
  createdAt: any
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(usersQuery)
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[]
        setUsers(usersData)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">إدارة المستخدمين</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.displayName || 'مستخدم'}</p>
                        <p className="text-dark-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="text-left">
                        <p className="text-white font-medium">{user.points?.toLocaleString() || 0} نقطة</p>
                        <p className="text-dark-400 text-sm">
                          {user.createdAt?.toDate?.()?.toLocaleDateString('ar-SA') || 'غير محدد'}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                          {user.status === 'active' ? 'نشط' : user.status}
                        </Badge>
                        {user.isAdmin && (
                          <Badge variant="info" size="sm">مدير</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="w-16 h-16" />}
                title="لا يوجد مستخدمين"
                description="سيظهر المستخدمون هنا عند التسجيل"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}