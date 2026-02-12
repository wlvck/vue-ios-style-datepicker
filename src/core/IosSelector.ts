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
      // Render items for infinite scroll (5x source for seamless looping)
      const items = [...source, ...source, ...source, ...source, ...source]
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

  // For infinite mode: get the source index (0 to source.length-1) from current position
  function getSourceIndexFromPosition(y: number): number {
    if (type === 'infinite') {
      // Calculate which item is at the highlight position
      // Highlight is at halfCount * itemHeight from top
      // Item at DOM index i is at (i * itemHeight + y) from top
      // For item at highlight: i * itemHeight + y = halfCount * itemHeight
      // i = halfCount - y / itemHeight
      const domIndex = Math.round(halfCount - y / itemHeight)
      // Normalize to source index (handle negative values too)
      const len = source.length
      return ((domIndex % len) + len) % len
    } else {
      // Normal mode: account for padding
      const index = Math.round(-y / itemHeight)
      return Math.max(0, Math.min(index, source.length - 1))
    }
  }

  // For infinite mode: get position that places source index at highlight
  function getPositionFromSourceIndex(index: number): number {
    if (type === 'infinite') {
      // Place the item from the middle set (set index 2 out of 0,1,2,3,4) at highlight
      // Middle set starts at DOM index 2 * source.length
      const middleSetStart = 2 * source.length
      const domIndex = middleSetStart + index
      // Position so this domIndex is at highlight
      // domIndex * itemHeight + y = halfCount * itemHeight
      // y = (halfCount - domIndex) * itemHeight
      return (halfCount - domIndex) * itemHeight
    } else {
      return -index * itemHeight
    }
  }

  function wrapToMiddleSet() {
    if (type !== 'infinite') return

    const setHeight = source.length * itemHeight
    // Middle set (set 2) position range
    const middleSetStart = (halfCount - 2 * source.length) * itemHeight
    const middleSetEnd = middleSetStart - setHeight

    // If we've scrolled more than 1 set away from middle, wrap back
    if (currentY > middleSetStart + setHeight) {
      // Scrolled too far up (into set 0 or 1)
      currentY -= setHeight * Math.floor((currentY - middleSetStart) / setHeight + 0.5)
      list.style.transition = 'none'
      list.style.transform = `translateY(${currentY}px)`
    } else if (currentY < middleSetEnd - setHeight) {
      // Scrolled too far down (into set 3 or 4)
      currentY += setHeight * Math.floor((middleSetEnd - currentY) / setHeight + 0.5)
      list.style.transition = 'none'
      list.style.transform = `translateY(${currentY}px)`
    }
  }

  function snapToNearest() {
    const sourceIndex = getSourceIndexFromPosition(currentY)
    currentIndex = sourceIndex

    const targetY = getPositionFromSourceIndex(sourceIndex)
    setPosition(targetY, true)

    if (onChange && source[sourceIndex]) {
      onChange(source[sourceIndex])
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
    } else {
      wrapToMiddleSet()
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
    wrapToMiddleSet()
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
    } else {
      wrapToMiddleSet()
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
      const initialY = getPositionFromSourceIndex(index)
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
        const targetY = getPositionFromSourceIndex(index)
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
        const targetY = getPositionFromSourceIndex(index)
        setPosition(targetY)
      } else {
        currentIndex = 0
        setPosition(getPositionFromSourceIndex(0))
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
