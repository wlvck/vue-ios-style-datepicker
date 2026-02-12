import type { IosSelectorConfig, IosSelectorInstance, SelectorOption } from './types'

const DEFAULT_CONFIG = {
  type: 'infinite' as const,
  count: 5,
  sensitivity: 0.8,
}

export function createIosSelector(config: IosSelectorConfig): IosSelectorInstance {
  const options = { ...DEFAULT_CONFIG, ...config }
  const { el, count, sensitivity, onChange, type } = options
  let { source } = options

  const itemHeight = 36
  const halfCount = Math.floor(count / 2)
  let currentIndex = 0
  let startY = 0
  let currentY = 0
  let lastY = 0
  let velocity = 0
  let animationId: number | null = null
  let wheelTimeout: ReturnType<typeof setTimeout> | null = null

  // Create DOM structure
  const wrapper = document.createElement('div')
  wrapper.className = 'ios-selector-wrapper'
  wrapper.style.height = `${itemHeight * count}px`

  const list = document.createElement('ul')
  list.className = 'ios-selector-list'
  wrapper.appendChild(list)

  // Highlight indicator
  const highlight = document.createElement('div')
  highlight.className = 'ios-selector-highlight'
  highlight.style.top = `${itemHeight * halfCount}px`
  highlight.style.height = `${itemHeight}px`
  wrapper.appendChild(highlight)

  // Gradient masks
  const maskTop = document.createElement('div')
  maskTop.className = 'ios-selector-mask ios-selector-mask-top'
  wrapper.appendChild(maskTop)

  const maskBottom = document.createElement('div')
  maskBottom.className = 'ios-selector-mask ios-selector-mask-bottom'
  wrapper.appendChild(maskBottom)

  el.appendChild(wrapper)

  function renderItems() {
    list.innerHTML = ''

    if (type === 'infinite') {
      // Render items for infinite scroll (3x source for seamless looping)
      const items = [...source, ...source, ...source]
      items.forEach((item, i) => {
        const li = document.createElement('li')
        li.className = 'ios-selector-item'
        li.textContent = item.label
        li.style.height = `${itemHeight}px`
        li.style.lineHeight = `${itemHeight}px`
        li.dataset.index = String(i)
        list.appendChild(li)
      })
    } else {
      // Normal mode with padding
      for (let i = 0; i < halfCount; i++) {
        const li = document.createElement('li')
        li.className = 'ios-selector-item ios-selector-item-placeholder'
        li.style.height = `${itemHeight}px`
        list.appendChild(li)
      }

      source.forEach((item, i) => {
        const li = document.createElement('li')
        li.className = 'ios-selector-item'
        li.textContent = item.label
        li.style.height = `${itemHeight}px`
        li.style.lineHeight = `${itemHeight}px`
        li.dataset.index = String(i)
        list.appendChild(li)
      })

      for (let i = 0; i < halfCount; i++) {
        const li = document.createElement('li')
        li.className = 'ios-selector-item ios-selector-item-placeholder'
        li.style.height = `${itemHeight}px`
        list.appendChild(li)
      }
    }
  }

  function setPosition(y: number, animate = false) {
    if (animate) {
      list.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
    } else {
      list.style.transition = 'none'
    }
    list.style.transform = `translateY(${y}px)`
    currentY = y
  }

  function getIndexFromPosition(y: number): number {
    const offset = type === 'infinite' ? source.length : 0
    return Math.round(-y / itemHeight) + offset
  }

  function getPositionFromIndex(index: number): number {
    const offset = type === 'infinite' ? source.length : 0
    return -(index - offset) * itemHeight
  }

  function normalizeIndex(index: number): number {
    if (type === 'infinite') {
      const len = source.length
      return ((index % len) + len) % len
    }
    return Math.max(0, Math.min(index, source.length - 1))
  }

  function snapToNearest() {
    const rawIndex = getIndexFromPosition(currentY)
    const normalizedIndex = normalizeIndex(rawIndex)
    currentIndex = normalizedIndex

    if (type === 'infinite') {
      // Reset position to middle set for seamless looping
      const targetY = getPositionFromIndex(source.length + normalizedIndex)
      setPosition(targetY, true)
    } else {
      const targetY = getPositionFromIndex(normalizedIndex)
      setPosition(targetY, true)
    }

    if (onChange && source[normalizedIndex]) {
      onChange(source[normalizedIndex])
    }
  }

  function decelerate() {
    if (Math.abs(velocity) < 0.5) {
      snapToNearest()
      return
    }

    velocity *= 0.95
    currentY += velocity

    // Bounds check for normal mode
    if (type === 'normal') {
      const minY = -(source.length - 1) * itemHeight
      const maxY = 0
      if (currentY > maxY) {
        currentY = maxY
        velocity = 0
      } else if (currentY < minY) {
        currentY = minY
        velocity = 0
      }
    }

    setPosition(currentY)
    animationId = requestAnimationFrame(decelerate)
  }

  function handleTouchStart(e: TouchEvent) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    startY = e.touches[0].clientY
    lastY = startY
    velocity = 0
    list.style.transition = 'none'
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    const touchY = e.touches[0].clientY
    const deltaY = (touchY - lastY) * sensitivity
    velocity = touchY - lastY
    lastY = touchY
    currentY += deltaY
    setPosition(currentY)
  }

  function handleTouchEnd() {
    if (Math.abs(velocity) > 1) {
      animationId = requestAnimationFrame(decelerate)
    } else {
      snapToNearest()
    }
  }

  // Mouse wheel support
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    currentY -= e.deltaY * 0.5

    if (type === 'normal') {
      const minY = -(source.length - 1) * itemHeight
      const maxY = 0
      currentY = Math.max(minY, Math.min(maxY, currentY))
    }

    setPosition(currentY)

    // Debounced snap
    if (wheelTimeout) {
      clearTimeout(wheelTimeout)
    }
    wheelTimeout = setTimeout(snapToNearest, 150)
  }

  // Initialize
  renderItems()

  // Set initial value
  if (config.value !== undefined) {
    const index = source.findIndex((s) => s.value === config.value)
    if (index !== -1) {
      currentIndex = index
      const initialY = getPositionFromIndex(type === 'infinite' ? source.length + index : index)
      setPosition(initialY)
    }
  }

  // Event listeners
  wrapper.addEventListener('touchstart', handleTouchStart, { passive: true })
  wrapper.addEventListener('touchmove', handleTouchMove, { passive: false })
  wrapper.addEventListener('touchend', handleTouchEnd)
  wrapper.addEventListener('wheel', handleWheel, { passive: false })

  return {
    select(value: number) {
      const index = source.findIndex((s) => s.value === value)
      if (index !== -1) {
        currentIndex = index
        const targetY = getPositionFromIndex(type === 'infinite' ? source.length + index : index)
        setPosition(targetY, true)
      }
    },

    getValue(): number {
      return source[currentIndex]?.value ?? 0
    },

    updateSource(newSource: SelectorOption[]) {
      source = newSource
      renderItems()

      // Re-select current value if still exists
      const index = source.findIndex((s) => s.value === currentIndex)
      if (index !== -1) {
        const targetY = getPositionFromIndex(type === 'infinite' ? source.length + index : index)
        setPosition(targetY)
      } else {
        currentIndex = 0
        setPosition(getPositionFromIndex(type === 'infinite' ? source.length : 0))
      }
    },

    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      wrapper.removeEventListener('touchstart', handleTouchStart)
      wrapper.removeEventListener('touchmove', handleTouchMove)
      wrapper.removeEventListener('touchend', handleTouchEnd)
      wrapper.removeEventListener('wheel', handleWheel)
      el.removeChild(wrapper)
    },
  }
}
