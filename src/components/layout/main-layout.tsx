import { Header } from './header'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}