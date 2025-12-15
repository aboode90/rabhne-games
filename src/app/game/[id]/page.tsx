import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { GameClient } from '@/components/game/game-client'
import { MOCK_GAMES } from '@/data/games.mock'
import { ArrowLeft } from 'lucide-react'

export function generateStaticParams() {
  return []
}

export default function GamePage({ params }: { params: { id: string } }) {
  const game = MOCK_GAMES.find(g => g.id === params.id)
  
  if (!game) {
    notFound()
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/games" className="inline-flex items-center px-4 py-2 text-dark-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </a>
        </div>

        <GameClient game={game} />
      </div>
    </MainLayout>
  )
}