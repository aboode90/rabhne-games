'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { MOCK_GAMES } from '@/data/games.mock'
import { GAME_CATEGORIES, GAME_PROVIDERS, ROUTES, APP_CONFIG } from '@/lib/config'
import { EarningStatus } from '@/types'
import toast from 'react-hot-toast'
import {
  Play,
  Pause,
  Star,
  Eye,
  Clock,
  Coins,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const gameId = params.id as string
  
  const [game, setGame] = useState(() => MOCK_GAMES.find(g => g.id === gameId))
  const [earningStatus, setEarningStatus] = useState<EarningStatus>({
    isEarning: false,
    pointsEarned: 0,
    sessionDuration: 0,
    pointsToday: user?.pointsToday || 0,
    dailyLimit: APP_CONFIG.points.dailyLimit,
    canEarn: true,
  })
  
  const sessionRef = useRef<{
    startTime: Date | null
    intervalId: NodeJS.Timeout | null
    heartbeatId: NodeJS.Timeout | null
  }>({
    startTime: null,
    intervalId: null,
    heartbeatId: null,
  })

  // Redirect if game not found
  useEffect(() => {
    if (!game) {
      toast.error('اللعبة غير موجودة')
      router.push(ROUTES.GAMES)
    }
  }, [game, router])

  // Check if user can earn
  useEffect(() => {
    if (user) {
      const canEarn = user.pointsToday < APP_CONFIG.points.dailyLimit
      setEarningStatus(prev => ({
        ...prev,
        pointsToday: user.pointsToday,
        canEarn,
      }))
    }
  }, [user])

  // Start earning session
  const startSession = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً')
      router.push(ROUTES.LOGIN)
      return
    }

    if (!earningStatus.canEarn) {
      toast.error('لقد وصلت إلى الحد الأقصى اليومي')
      return
    }

    const now = new Date()
    sessionRef.current.startTime = now
    
    // Update earning status
    setEarningStatus(prev => ({ ...prev, isEarning: true }))
    
    // Start duration counter
    sessionRef.current.intervalId = setInterval(() => {
      if (sessionRef.current.startTime) {
        const duration = Math.floor((Date.now() - sessionRef.current.startTime.getTime()) / 1000)
        const pointsEarned = Math.floor(duration / 60) // 1 point per minute
        
        setEarningStatus(prev => ({
          ...prev,
          sessionDuration: duration,
          pointsEarned,
        }))
      }
    }, 1000)

    // Start heartbeat (for future server sync)
    sessionRef.current.heartbeatId = setInterval(() => {
      // In Phase 2, send heartbeat to server
      console.log('Heartbeat:', {
        gameId,
        duration: sessionRef.current.startTime 
          ? Math.floor((Date.now() - sessionRef.current.startTime.getTime()) / 1000)
          : 0
      })
    }, APP_CONFIG.session.heartbeatInterval)

    toast.success('بدأت جلسة الربح!')
  }

  // Stop earning session
  const stopSession = () => {
    if (sessionRef.current.intervalId) {
      clearInterval(sessionRef.current.intervalId)
      sessionRef.current.intervalId = null
    }
    
    if (sessionRef.current.heartbeatId) {
      clearInterval(sessionRef.current.heartbeatId)
      sessionRef.current.heartbeatId = null
    }

    setEarningStatus(prev => ({ ...prev, isEarning: false }))
    sessionRef.current.startTime = null
    
    toast.success(`انتهت الجلسة! ربحت ${earningStatus.pointsEarned} نقطة`)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current.intervalId) {
        clearInterval(sessionRef.current.intervalId)
      }
      if (sessionRef.current.heartbeatId) {
        clearInterval(sessionRef.current.heartbeatId)
      }
    }
  }, [])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!game) {
    return null
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Container */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{game.titleAr}</CardTitle>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <Badge variant="info">
                        {GAME_PROVIDERS[game.provider]}
                      </Badge>
                      <Badge variant="default">
                        {GAME_CATEGORIES[game.category]}
                      </Badge>
                      {game.rating && (
                        <div className="flex items-center text-sm text-dark-400">
                          <Star className="w-4 h-4 text-yellow-400 ml-1" />
                          <span>{game.rating}</span>
                        </div>
                      )}
                      {game.plays && (
                        <div className="flex items-center text-sm text-dark-400">
                          <Eye className="w-4 h-4 ml-1" />
                          <span>{game.plays.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="game-container aspect-video">
                  <iframe
                    src={game.embedUrl}
                    title={game.titleAr}
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earning Panel */}
          <div className="space-y-6">
            {/* Earning Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="w-5 h-5 ml-2 text-yellow-400" />
                  حالة الربح
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <>
                    {/* Session Controls */}
                    <div className="text-center">
                      {earningStatus.isEarning ? (
                        <Button
                          onClick={stopSession}
                          variant="danger"
                          className="w-full"
                        >
                          <Pause className="w-4 h-4 ml-2" />
                          إيقاف الربح
                        </Button>
                      ) : (
                        <Button
                          onClick={startSession}
                          disabled={!earningStatus.canEarn}
                          className="w-full"
                        >
                          <Play className="w-4 h-4 ml-2" />
                          بدء الربح
                        </Button>
                      )}
                    </div>

                    {/* Session Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-dark-400">مدة الجلسة:</span>
                        <span className="font-mono text-primary-400">
                          {formatTime(earningStatus.sessionDuration)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-dark-400">النقاط المكتسبة:</span>
                        <span className="font-bold text-yellow-400">
                          {earningStatus.pointsEarned}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-dark-400">نقاط اليوم:</span>
                        <span className="font-bold text-white">
                          {earningStatus.pointsToday} / {earningStatus.dailyLimit}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(earningStatus.pointsToday / earningStatus.dailyLimit) * 100}%`
                        }}
                      />
                    </div>

                    {/* Daily Limit Warning */}
                    {!earningStatus.canEarn && (
                      <div className="flex items-center p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-400 ml-2" />
                        <span className="text-yellow-300 text-sm">
                          وصلت إلى الحد الأقصى اليومي
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-dark-400 mb-4">
                      سجل دخولك لبدء ربح النقاط
                    </p>
                    <Button
                      onClick={() => router.push(ROUTES.LOGIN)}
                      className="w-full"
                    >
                      تسجيل الدخول
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات اللعبة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-white mb-1">الوصف</h4>
                  <p className="text-dark-400 text-sm">
                    {game.descriptionAr || game.description || 'لعبة مسلية ومثيرة'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-1">الفئة</h4>
                  <p className="text-dark-400 text-sm">
                    {GAME_CATEGORIES[game.category]}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-1">المصدر</h4>
                  <p className="text-dark-400 text-sm">
                    {GAME_PROVIDERS[game.provider]}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Earning Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 ml-2" />
                  قواعد الربح
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-dark-400">
                <p>• نقطة واحدة كل دقيقة لعب</p>
                <p>• الحد الأقصى: {APP_CONFIG.points.dailyLimit} نقطة يومياً</p>
                <p>• {APP_CONFIG.points.toDollarRate} نقطة = $1</p>
                <p>• الحد الأدنى للسحب: {APP_CONFIG.points.minWithdraw} نقطة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}