'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'
import { ROUTES } from '@/lib/config'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
} from 'lucide-react'

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN)
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
      })
    }
  }, [user])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  const handleSave = async () => {
    try {
      // In Phase 2, this would update the user profile
      toast.success('تم حفظ التغييرات بنجاح')
      setEditing(false)
      await refreshUser()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('حدث خطأ أثناء حفظ التغييرات')
    }
  }

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName || '',
    })
    setEditing(false)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">الملف الشخصي</h1>
          <p className="text-dark-400">
            إدارة معلوماتك الشخصية وإعدادات الحساب
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 ml-2" />
                    المعلومات الشخصية
                  </CardTitle>
                  {!editing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                  ) : (
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 ml-1" />
                        حفظ
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    الاسم المعروض
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="اسمك المعروض"
                    />
                  ) : (
                    <p className="text-white bg-dark-700 px-4 py-3 rounded-lg">
                      {user.displayName || 'غير محدد'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="w-5 h-5 text-dark-400" />
                    <p className="text-white bg-dark-700 px-4 py-3 rounded-lg flex-1">
                      {user.email}
                    </p>
                  </div>
                  <p className="text-dark-400 text-sm mt-1">
                    لا يمكن تغيير البريد الإلكتروني
                  </p>
                </div>

                {/* Registration Date */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    تاريخ التسجيل
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <p className="text-white bg-dark-700 px-4 py-3 rounded-lg flex-1">
                      {user.createdAt.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    حالة الحساب
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Shield className="w-5 h-5 text-green-400" />
                    <p className="text-white bg-dark-700 px-4 py-3 rounded-lg flex-1">
                      {user.status === 'active' ? 'نشط' : user.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Stats */}
          <div className="space-y-6">
            {/* Points Summary */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص النقاط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">
                    {user.points.toLocaleString()}
                  </p>
                  <p className="text-dark-400 text-sm">إجمالي النقاط</p>
                  <p className="text-green-400 font-medium mt-2">
                    ≈ ${(user.points / 10000).toFixed(2)}
                  </p>
                </div>
                
                <div className="border-t border-dark-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-dark-400 text-sm">نقاط اليوم</span>
                    <span className="text-white font-medium">{user.pointsToday}</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((user.pointsToday / 2880) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-dark-400 text-xs mt-1">
                    من 2,880 نقطة يومياً
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle>أمان الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-sm">كلمة المرور</span>
                  <Button variant="ghost" size="sm">
                    تغيير
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-sm">المصادقة الثنائية</span>
                  <Button variant="ghost" size="sm">
                    قريباً
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-sm">آخر تسجيل دخول</span>
                  <span className="text-white text-sm">
                    {user.lastLoginAt.toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Badge */}
            {user.isAdmin && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-medium">مدير النظام</p>
                  <p className="text-dark-400 text-sm">
                    لديك صلاحيات إدارية
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push(ROUTES.ADMIN)}
                  >
                    لوحة الإدارة
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(ROUTES.DASHBOARD)}
                >
                  لوحة التحكم
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(ROUTES.WITHDRAW)}
                >
                  سحب الأرباح
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(ROUTES.SUPPORT)}
                >
                  الدعم الفني
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}