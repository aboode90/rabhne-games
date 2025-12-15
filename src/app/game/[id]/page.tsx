import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { GameClient } from '@/components/game/game-client'
import { MOCK_GAMES } from '@/data/games.mock'
import { ArrowLeft } from 'lucide-react'

export function generateStaticParams() {
  return MOCK_GAMES.map((game) => ({
    id: game.id,
  }))
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
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
        </div>

        <GameClient game={game} />
      </div>
    </MainLayout>
  )
}