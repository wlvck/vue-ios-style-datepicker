import type { IosSelectorConfig, IosSelectorInstance, SelectorOption } from './types'

const easing = {
  easeOutCubic: (t: number) => Math.pow(t - 1, 3) + 1,
  easeOutQuart: (t: number) => -(Math.pow(t - 1, 4) - 1),
}

export function createIosSelector(config: IosSelectorConfig): IosSelectorInstance {
  const { el, type = 'infinite', count = 20, sensitivity = 0.8, onChange } = config
  let { source } = config

  // Ensure count is divisible by 4
  const itemCount = count - (count % 4)
  const halfCount = itemCount / 2
  const quarterCount = itemCount / 4

  // Physics constants
  const a = sensitivity * 10 // deceleration
  const exceedA = 10 // exceed boundary deceleration

  // Calculate dimensions
  const itemHeight = (el.offsetHeight * 3) / itemCount
  const itemAngle = 360 / itemCount
  const radius = itemHeight / Math.tan((itemAngle * Math.PI) / 180)

  // State
  let scroll = 0
  let selected = source[0]
  let moving = false
  let moveT = 0

  // DOM elements
  let circleList: HTMLElement | null = null
  let circleItems: NodeListOf<HTMLElement> | null = null
  let highlightList: HTMLElement | null = null

  // Touch data
  const touchData = {
    startY: 0,
    yArr: [] as [number, number][],
    touchScroll: 0,
  }

  function create(sourceData: SelectorOption[]) {
    if (!sourceData.length) return

    // For infinite mode, ensure we have enough items
    if (type === 'infinite') {
      let concatSource = [...sourceData]
      while (concatSource.length < halfCount) {
        concatSource = [...concatSource, ...sourceData]
      }
      source = concatSource
    } else {
      source = sourceData
    }

    const sourceLength = source.length

    // Build circle list HTML (3D cylinder)
    let circleListHTML = ''
    for (let i = 0; i < source.length; i++) {
      circleListHTML += `<li class="ios-selector-option"
        style="
          top: ${itemHeight * -0.5}px;
          height: ${itemHeight}px;
          line-height: ${itemHeight}px;
          transform: rotateX(${-itemAngle * i}deg) translate3d(0, 0, ${radius}px);
        "
        data-index="${i}"
      >${source[i].label}</li>`
    }

    // Build highlight list HTML (flat list for selected item display)
    let highListHTML = ''
    for (let i = 0; i < source.length; i++) {
      highListHTML += `<li class="ios-selector-highlight-item" style="height: ${itemHeight}px;">${source[i].label}</li>`
    }

    // Add extra items for infinite scroll
    if (type === 'infinite') {
      for (let i = 0; i < quarterCount; i++) {
        // Prepend items
        circleListHTML =
          `<li class="ios-selector-option"
          style="
            top: ${itemHeight * -0.5}px;
            height: ${itemHeight}px;
            line-height: ${itemHeight}px;
            transform: rotateX(${itemAngle * (i + 1)}deg) translate3d(0, 0, ${radius}px);
          "
          data-index="${-i - 1}"
        >${source[sourceLength - i - 1].label}</li>` + circleListHTML

        // Append items
        circleListHTML += `<li class="ios-selector-option"
          style="
            top: ${itemHeight * -0.5}px;
            height: ${itemHeight}px;
            line-height: ${itemHeight}px;
            transform: rotateX(${-itemAngle * (i + sourceLength)}deg) translate3d(0, 0, ${radius}px);
          "
          data-index="${i + sourceLength}"
        >${source[i].label}</li>`
      }

      // Prepend/append highlight items
      highListHTML =
        `<li class="ios-selector-highlight-item" style="height: ${itemHeight}px;">${source[sourceLength - 1].label}</li>` +
        highListHTML
      highListHTML += `<li class="ios-selector-highlight-item" style="height: ${itemHeight}px;">${source[0].label}</li>`
    }

    el.innerHTML = `
      <div class="ios-selector-wrap">
        <ul class="ios-selector-options" style="transform: translate3d(0, 0, ${-radius}px) rotateX(0deg);">
          ${circleListHTML}
        </ul>
        <div class="ios-selector-highlight">
          <ul class="ios-selector-highlight-list">
            ${highListHTML}
          </ul>
        </div>
      </div>
    `

    circleList = el.querySelector('.ios-selector-options')
    circleItems = el.querySelectorAll('.ios-selector-option')
    highlightList = el.querySelector('.ios-selector-highlight-list')

    const highlight = el.querySelector('.ios-selector-highlight') as HTMLElement
    if (highlight) {
      highlight.style.height = `${itemHeight}px`
      highlight.style.lineHeight = `${itemHeight}px`
    }

    if (type === 'infinite' && highlightList) {
      highlightList.style.top = `${-itemHeight}px`
    }
  }

  function normalizeScroll(s: number): number {
    let normalized = s
    while (normalized < 0) {
      normalized += source.length
    }
    return normalized % source.length
  }

  function moveTo(s: number): number {
    if (type === 'infinite') {
      s = normalizeScroll(s)
    }

    if (circleList) {
      circleList.style.transform = `translate3d(0, 0, ${-radius}px) rotateX(${itemAngle * s}deg)`
    }

    if (highlightList) {
      highlightList.style.transform = `translate3d(0, ${-s * itemHeight}px, 0)`
    }

    // Hide items that are too far from view
    if (circleItems) {
      circleItems.forEach((item) => {
        const index = parseInt(item.dataset.index || '0', 10)
        if (Math.abs(index - s) > quarterCount) {
          item.style.visibility = 'hidden'
        } else {
          item.style.visibility = 'visible'
        }
      })
    }

    return s
  }

  function animateToScroll(
    initScroll: number,
    finalScroll: number,
    t: number,
    easingName: 'easeOutCubic' | 'easeOutQuart' = 'easeOutQuart'
  ): Promise<void> {
    if (initScroll === finalScroll || t === 0) {
      moveTo(initScroll)
      return Promise.resolve()
    }

    const start = Date.now() / 1000
    const totalScrollLen = finalScroll - initScroll

    return new Promise((resolve) => {
      moving = true

      const tick = () => {
        const pass = Date.now() / 1000 - start

        if (pass < t) {
          scroll = moveTo(initScroll + easing[easingName](pass / t) * totalScrollLen)
          moveT = requestAnimationFrame(tick)
        } else {
          stop()
          scroll = moveTo(initScroll + totalScrollLen)
          resolve()
        }
      }

      tick()
    })
  }

  function stop() {
    moving = false
    cancelAnimationFrame(moveT)
  }

  function selectByScroll(s: number) {
    s = type === 'infinite' ? normalizeScroll(s) : Math.round(s)

    if (s > source.length - 1) {
      s = source.length - 1
      moveTo(s)
    }

    moveTo(s)
    scroll = s
    selected = source[s]

    if (onChange && selected) {
      onChange(selected)
    }
  }

  async function animateMoveByInitV(initV: number) {
    if (type === 'normal') {
      if (scroll < 0 || scroll > source.length - 1) {
        // Bounce back from exceed
        const initScroll = scroll
        const finalScroll = scroll < 0 ? 0 : source.length - 1
        const totalScrollLen = initScroll - finalScroll
        const t = Math.sqrt(Math.abs(totalScrollLen / exceedA))
        await animateToScroll(initScroll, finalScroll, t)
      } else {
        // Normal deceleration
        const initScroll = scroll
        const decel = initV > 0 ? -a : a
        let t = Math.abs(initV / decel)
        let totalScrollLen = initV * t + (decel * t * t) / 2
        let finalScroll = Math.round(scroll + totalScrollLen)

        // Clamp to bounds
        finalScroll = Math.max(0, Math.min(finalScroll, source.length - 1))
        totalScrollLen = finalScroll - initScroll
        t = Math.sqrt(Math.abs(totalScrollLen / a))

        await animateToScroll(scroll, finalScroll, t, 'easeOutQuart')
      }
    } else {
      // Infinite mode
      const decel = initV > 0 ? -a : a
      const t = Math.abs(initV / decel)
      const totalScrollLen = initV * t + (decel * t * t) / 2
      const finalScroll = Math.round(scroll + totalScrollLen)

      await animateToScroll(scroll, finalScroll, t, 'easeOutQuart')
    }

    selectByScroll(scroll)
  }

  // Touch handlers
  function handleTouchStart(e: TouchEvent | MouseEvent) {
    const eventY = 'touches' in e ? e.touches[0].clientY : e.clientY
    touchData.startY = eventY
    touchData.yArr = [[eventY, Date.now()]]
    touchData.touchScroll = scroll
    stop()

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('mousemove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('mouseup', handleTouchEnd)
  }

  function handleTouchMove(e: TouchEvent | MouseEvent) {
    if (e.cancelable) e.preventDefault()

    const eventY = 'touches' in e ? e.touches[0].clientY : e.clientY
    touchData.yArr.push([eventY, Date.now()])

    if (touchData.yArr.length > 5) {
      touchData.yArr.shift()
    }

    const scrollAdd = (touchData.startY - eventY) / itemHeight
    let moveToScroll = scrollAdd + touchData.touchScroll

    if (type === 'normal') {
      // Add resistance at boundaries
      if (moveToScroll < 0) {
        moveToScroll *= 0.3
      } else if (moveToScroll > source.length - 1) {
        moveToScroll = source.length - 1 + (moveToScroll - source.length + 1) * 0.3
      }
    }

    scroll = moveTo(moveToScroll)
  }

  function handleTouchEnd() {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('mousemove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('mouseup', handleTouchEnd)

    let v: number

    if (touchData.yArr.length === 1) {
      v = 0
    } else {
      const len = touchData.yArr.length
      const startTime = touchData.yArr[len - 2][1]
      const endTime = touchData.yArr[len - 1][1]
      const startY = touchData.yArr[len - 2][0]
      const endY = touchData.yArr[len - 1][0]

      // Calculate velocity (items per second)
      v = (((startY - endY) / itemHeight) * 1000) / (endTime - startTime)

      // Clamp velocity
      const sign = v > 0 ? 1 : -1
      v = Math.abs(v) > 30 ? 30 * sign : v
    }

    animateMoveByInitV(v)
  }

  // Mouse wheel handler
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    stop()

    const delta = e.deltaY / itemHeight
    let newScroll = scroll + delta

    if (type === 'normal') {
      newScroll = Math.max(0, Math.min(newScroll, source.length - 1))
    }

    scroll = moveTo(newScroll)

    // Debounced snap
    clearTimeout(moveT)
    moveT = window.setTimeout(() => {
      const finalScroll = Math.round(scroll)
      const t = 0.1
      animateToScroll(scroll, finalScroll, t).then(() => {
        selectByScroll(finalScroll)
      })
    }, 150)
  }

  // Initialize
  create(source)

  // Set initial value
  if (config.value !== undefined) {
    const index = source.findIndex((s) => s.value === config.value)
    if (index !== -1) {
      scroll = index
      moveTo(scroll)
      selected = source[index]
    }
  }

  // Attach event listeners
  el.addEventListener('touchstart', handleTouchStart, { passive: true })
  el.addEventListener('mousedown', handleTouchStart)
  el.addEventListener('wheel', handleWheel, { passive: false })

  return {
    select(value: number) {
      const index = source.findIndex((s) => s.value === value)
      if (index !== -1) {
        stop()
        const initScroll = normalizeScroll(scroll)
        const finalScroll = index
        const t = Math.sqrt(Math.abs((finalScroll - initScroll) / a))
        animateToScroll(initScroll, finalScroll, t).then(() => {
          selectByScroll(index)
        })
      }
    },

    getValue(): number {
      return selected?.value ?? 0
    },

    updateSource(newSource: SelectorOption[]) {
      create(newSource)
      if (!moving) {
        selectByScroll(scroll)
      }
    },

    destroy() {
      stop()
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('mousedown', handleTouchStart)
      el.removeEventListener('wheel', handleWheel)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mousemove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('mouseup', handleTouchEnd)
      el.innerHTML = ''
    },
  }
}
