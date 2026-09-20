'use client'

import React from 'react'

interface AerisCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  interactive?: boolean
  variant?: 'default' | 'glow' | 'active' | 'emergency'
}

export function AerisCard({
  children,
  className = '',
  elevated = false,
  interactive = false,
  variant = 'default',
  style,
  ...props
}: AerisCardProps) {
  if (variant === 'glow') {
    return (
      <div
        className={`relative rounded-2xl bg-white border border-slate-200 shadow-sm p-6 transition-all duration-300 hover:border-red-500/40 hover:shadow-md ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (variant === 'active') {
    return (
      <div
        className={`relative rounded-2xl bg-white border border-red-500/50 shadow-md ring-1 ring-red-500/20 p-6 ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (variant === 'emergency') {
    return (
      <div
        className={`relative rounded-2xl bg-red-50/90 border border-red-500/50 shadow-md ring-1 ring-red-500/30 p-6 ${interactive ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={`panel ${interactive ? 'interactive-card' : ''} ${className}`}
      style={{
        background: elevated ? 'var(--panel-elevated)' : '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
