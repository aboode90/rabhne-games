import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    return (
      <div
        className={clsx(
          'inline-flex items-center rounded-full font-medium',
          {
            // Variants
            'bg-dark-700 text-dark-300': variant === 'default',
            'bg-green-900/50 text-green-300 border border-green-700': variant === 'success',
            'bg-yellow-900/50 text-yellow-300 border border-yellow-700': variant === 'warning',
            'bg-red-900/50 text-red-300 border border-red-700': variant === 'danger',
            'bg-blue-900/50 text-blue-300 border border-blue-700': variant === 'info',
            
            // Sizes
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-sm': size === 'md',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }