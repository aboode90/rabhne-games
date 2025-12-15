'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameCardSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { MOCK_GAMES } from '@/data/games.mock'
import { GAME_CATEGORIES, GAME_PROVIDERS, ROUTES } from '@/lib/config'
import { GameFilters } from '@/types'
import {
  Search,
  Filter,
  Play,
  Star,
  Eye,
  Gamepad2,
} from 'lucide-react'

export default function GamesPage() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<GameFilters>({
    search: '',
    category: undefined,
    provider: undefined,
    sort: 'newest',
  })

  const filteredGames = useMemo(() => {
    let games = [...MOCK_GAMES]

    // Search filter
    if (filters.search) {
      games = games.filter(game => 
        game.titleAr.toLowerCase().includes(filters.search!.toLowerCase()) ||
        game.title.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // Category filter
    if (filters.category) {
      games = games.filter(game => game.category === filters.category)
    }

    // Provider filter
    if (filters.provider) {
      games = games.filter(game => game.provider === filters.provider)
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        games.sort((a, b) => (b.plays || 0) - (a.plays || 0))
        break
      case 'rating':
        games.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'alphabetical':
        games.sort((a, b) => a.titleAr.localeCompare(b.titleAr))
        break
      case 'newest':
      default:
        games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
    }

    return games
  }, [filters])

  const categories = Object.entries(GAME_CATEGORIES)
  const providers = Object.entries(GAME_PROVIDERS)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">الألعاب</h1>
          <p className="text-dark-400">اكتشف مجموعة كبيرة من الألعاب المسلية واربح النقاط</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 h-5 w-5" />
            <input
              type="text"
              placeholder="ابحث عن لعبة..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pr-10 pl-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                category: e.target.value as any || undefined 
              }))}
              className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">جميع الفئات</option>
              {categories.map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>

            {/* Provider Filter */}
            <select
              value={filters.provider || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                provider: e.target.value as any || undefined 
              }))}
              className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">جميع المصادر</option>
              {providers.map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                sort: e.target.value as any 
              }))}
              className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر شعبية</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="alphabetical">أبجدياً</option>
            </select>

            {/* Clear Filters */}
            {(filters.search || filters.category || filters.provider) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ search: '', sort: 'newest' })}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-dark-400">
            {filteredGames.length} لعبة متاحة
          </p>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="games-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <Card key={game.id} hover className="overflow-hidden">
                <div className="relative">
                  <div className="aspect-video bg-dark-700 relative overflow-hidden">
                    <Image
                      src={game.thumbnailUrl}
                      alt={game.titleAr}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/img/placeholder.svg'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Link href={`${ROUTES.GAME}/${game.id}`}>
                        <Button size="sm">
                          <Play className="w-4 h-4 ml-1" />
                          العب الآن
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Provider Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="info" size="sm">
                      {GAME_PROVIDERS[game.provider]}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-1 truncate">
                    {game.titleAr}
                  </h3>
                  <p className="text-dark-400 text-sm mb-3 line-clamp-2">
                    {game.descriptionAr || 'لعبة مسلية ومثيرة'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-dark-400">
                      {game.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 ml-1" />
                          <span>{game.rating}</span>
                        </div>
                      )}
                      {game.plays && (
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 ml-1" />
                          <span>{game.plays.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <Badge variant="default" size="sm">
                      {GAME_CATEGORIES[game.category]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Gamepad2 className="w-16 h-16" />}
            title="لا توجد ألعاب"
            description="لم نجد أي ألعاب تطابق معايير البحث الخاصة بك"
            action={{
              label: 'مسح الفلاتر',
              onClick: () => setFilters({ search: '', sort: 'newest' })
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}