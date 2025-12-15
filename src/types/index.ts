export interface User {
  uid: string
  email: string | null
  displayName: string
  photoURL?: string | null
  points: number
  pointsToday: number
  status: 'active' | 'suspended' | 'banned'
  isAdmin?: boolean
  createdAt: Date
  lastLoginAt: Date
}

export interface Game {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  thumbnailUrl: string
  category: GameCategory
  provider: GameProvider
  sourceType: GameSourceType
  embedUrl: string
  isEnabled: boolean
  plays?: number
  rating?: number
  createdAt: Date
  updatedAt: Date
}

export type GameCategory = 
  | 'action' | 'puzzle' | 'racing' | 'sports' | 'strategy' 
  | 'arcade' | 'adventure' | 'shooting' | 'platform' | 'casual'

export type GameProvider = 'GameMonetize' | 'Custom' | 'Partner' | 'Mock'

export type GameSourceType = 'iframe' | 'html5' | 'flash' | 'unity'

export interface GameSession {
  id: string
  uid: string
  gameId: string
  startedAt: Date
  endedAt?: Date
  duration: number // in seconds
  pointsEarned: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  heartbeats: number
  lastHeartbeat: Date
}

export interface Transaction {
  id: string
  uid: string
  type: 'earn' | 'spend' | 'withdraw_lock' | 'withdraw_unlock'
  pointsDelta: number
  pointsBalance: number
  meta: {
    gameId?: string
    sessionId?: string
    withdrawRequestId?: string
    reason?: string
  }
  createdAt: Date
}

export interface WithdrawRequest {
  id: string
  uid: string
  walletTRC20: string
  amountUSDT: number
  pointsCost: number
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  processedBy?: string
  processedAt?: Date
  txHash?: string
  notes?: string
}

export interface AppConfig {
  points: {
    perMinute: number
    dailyLimit: number
    minWithdraw: number
    toDollarRate: number
  }
  session: {
    heartbeatInterval: number
    maxIdleTime: number
  }
  withdraw: {
    minAmount: number
    maxAmount: number
    processingTime: string
  }
}

export interface GameFilters {
  search?: string
  category?: GameCategory
  provider?: GameProvider
  sort?: 'newest' | 'popular' | 'rating' | 'alphabetical'
  limit?: number
  cursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface EarningStatus {
  isEarning: boolean
  pointsEarned: number
  sessionDuration: number
  pointsToday: number
  dailyLimit: number
  canEarn: boolean
  nextEarnTime?: Date
}