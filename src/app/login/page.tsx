'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/lib/config'
import toast from 'react-hot-toast'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(ROUTES.DASHBOARD)
    }
  }, [user, loading, router])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password)
        toast.success('تم تسجيل الدخول بنجاح!')
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('كلمات المرور غير متطابقة')
          return
        }
        if (formData.password.length < 6) {
          toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
          return
        }
        await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        toast.success('تم إنشاء الحساب بنجاح!')
      }
      // Redirect will happen automatically via useEffect when user state changes
    } catch (error: any) {
      console.error('Auth error:', error)
      
      const errorMessages: { [key: string]: string } = {
        'auth/user-not-found': 'المستخدم غير موجود',
        'auth/wrong-password': 'كلمة المرور خاطئة',
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/weak-password': 'كلمة المرور ضعيفة',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
        'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً',
      }
      
      const message = errorMessages[error.code] || 'حدث خطأ، حاول مرة أخرى'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setFormLoading(true)
    
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      toast.success('تم تسجيل الدخول بنجاح!')
      // Redirect will happen automatically via useEffect when user state changes
    } catch (error: any) {
      console.error('Google auth error:', error)
      
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('حدث خطأ أثناء تسجيل الدخول بـ Google')
      }
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="mt-2 text-dark-400">
            {isLogin 
              ? 'ادخل إلى حسابك وابدأ الربح' 
              : 'أنشئ حساباً جديداً واربح النقاط'
            }
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleAuth}
              disabled={formLoading}
              variant="ghost"
              className="w-full mb-6 border border-dark-600"
            >
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLogin ? 'تسجيل الدخول بـ Google' : 'إنشاء حساب بـ Google'}
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-800 text-dark-400">أو</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pr-10 pl-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pr-10 pl-10 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pr-10 pl-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                loading={formLoading}
                className="w-full"
              >
                {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                {isLogin 
                  ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' 
                  : 'لديك حساب بالفعل؟ سجل دخولك'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push(ROUTES.HOME)}
            className="text-dark-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  )
}