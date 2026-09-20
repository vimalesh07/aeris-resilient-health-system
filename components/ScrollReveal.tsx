'use client'

import React, { useEffect } from 'react'

/**
 * useScrollReveal Hook
 * Automatically attaches an IntersectionObserver to panels, cards, and sections
 * inside the main content area to trigger smooth, high-tech slide animations
 * (left-to-right + bottom-to-up) as elements scroll into view.
 */
export function useScrollReveal(activeView?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Honor reduced motion accessibility preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('in-view')
      })
      return
    }

    let observer: IntersectionObserver | null = null

    const initObserver = () => {
      // Find all content panels, metric cards, and explicit scroll-reveal items inside main content
      const targets = document.querySelectorAll<HTMLElement>(
        '.main-content .panel, .main-content .metric-card, .main-content .scroll-reveal, .main-content section > article, .main-content .content-head'
      )

      if (targets.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view')
              // Keep revealed once triggered so content doesn't flicker or re-hide during scrolling
              observer?.unobserve(entry.target)
            }
          })
        },
        {
          root: null, // window viewport
          rootMargin: '0px 0px -40px 0px', // trigger right as element reaches 40px above bottom
          threshold: 0.05,
        }
      )

      targets.forEach((el) => {
        // Exclude sticky headers or overlays
        if (el.classList.contains('topbar') || el.closest('.mobile-drawer') || el.closest('[role="dialog"]')) {
          return
        }

        // Apply scroll-reveal base class if not already attached
        if (!el.classList.contains('scroll-reveal')) {
          el.classList.add('scroll-reveal')
        }

        // Stagger grid siblings for a cascading wave effect
        const parent = el.parentElement
        if (parent && (parent.classList.contains('metrics-grid') || parent.classList.contains('grid') || parent.style.display === 'grid')) {
          const siblingIndex = Array.from(parent.children).indexOf(el)
          if (siblingIndex > 0) {
            el.style.transitionDelay = `${Math.min(siblingIndex * 0.08, 0.4)}s`
          }
        }

        // Check if element is already inside viewport on mount
        const rect = el.getBoundingClientRect()
        const isAlreadyVisible = rect.top < window.innerHeight - 30 && rect.bottom > 0
        if (isAlreadyVisible) {
          // Micro-delay so initial paint mounts smoothly with slide animation
          requestAnimationFrame(() => {
            el.classList.add('in-view')
          })
        } else {
          observer?.observe(el)
        }
      })
    }

    // Small delay to allow Next.js route view changes to render into DOM
    const timer = setTimeout(initObserver, 50)

    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [activeView])
}

/**
 * ScrollReveal Wrapper Component
 * Can be used to explicitly wrap any JSX snippet with custom delay or direction.
 */
interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function ScrollReveal({ children, delay = 0, className = '', style, ...props }: ScrollRevealProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    ...(delay > 0 ? { transitionDelay: `${delay}ms` } : {}),
  }

  return (
    <div className={`scroll-reveal ${className}`} style={customStyle} {...props}>
      {children}
    </div>
  )
}
