import type { EasingFunction } from './types'

/**
 * Easing functions for smooth animations
 * Based on Robert Penner's easing equations
 */

export const easeOutCubic: EasingFunction = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

export const easeOutQuart: EasingFunction = (t: number): number => {
  return 1 - Math.pow(1 - t, 4)
}

export const easeInOutCubic: EasingFunction = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const easeOutExpo: EasingFunction = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export const linear: EasingFunction = (t: number): number => t

/**
 * Default easing for scroll wheel deceleration
 */
export const defaultEasing = easeOutCubic
