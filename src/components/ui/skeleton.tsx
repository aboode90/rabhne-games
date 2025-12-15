import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height, 
  style,
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'shimmer bg-dark-700',
        {
          'rounded': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'rounded h-4': variant === 'text',
        },
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
}

export function GameCardSkeleton() {
  return (
    <div className="bg-dark-800 rounded-xl p-4 space-y-3">
      <Skeleton variant="rectangular" className="w-full h-40 rounded-lg" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-16" />
        <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 space-x-reverse">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton variant="rectangular" className="w-20 h-8 rounded" />
        </div>
      ))}
    </div>
  )
}