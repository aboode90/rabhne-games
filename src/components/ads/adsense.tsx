'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: string
  adLayout?: string
  adLayoutKey?: string
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  adLayout,
  adLayoutKey,
  fullWidthResponsive = true,
  style = { display: 'block' }
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-5100084329334269"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(adLayout && { 'data-ad-layout': adLayout })}
      {...(adLayoutKey && { 'data-ad-layout-key': adLayoutKey })}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  )
}