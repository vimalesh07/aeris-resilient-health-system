'use client'

import React from 'react'

interface AerisCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  interactive?: boolean
}

export function AerisCard({
  children,
  className = '',
  elevated = false,
  interactive = false,
  style,
  ...props
}: AerisCardProps) {
  return (
    <div
      className={`panel ${className}`}
      style={{
        background: elevated ? 'var(--panel-elevated)' : 'var(--panel-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.15s ease',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
