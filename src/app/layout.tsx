import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cairo'
})

export const metadata: Metadata = {
  title: 'Rabhne Games - ربحني جيمز',
  description: 'منصة الألعاب العربية الأولى لربح النقاط والجوائز',
  keywords: 'ألعاب, ربح, نقاط, جوائز, عربي, HTML5',
  authors: [{ name: 'Rabhne Games' }],
  creator: 'Rabhne Games',
  publisher: 'Rabhne Games',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rabhne.online'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Rabhne Games - ربحني جيمز',
    description: 'منصة الألعاب العربية الأولى لربح النقاط والجوائز',
    url: 'https://rabhne.online',
    siteName: 'Rabhne Games',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rabhne Games - ربحني جيمز',
    description: 'منصة الألعاب العربية الأولى لربح النقاط والجوائز',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} bg-dark-900 text-white min-h-screen`}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5100084329334269"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontFamily: 'Cairo, sans-serif',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}