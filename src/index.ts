import type { App, Plugin } from 'vue'
import IosDatepicker from './components/IosDatepicker.vue'

// Export component
export { IosDatepicker }

// Export types
export * from './core/types'

// Export utilities
export * from './utils/date'

// Export composables
export { useDatepicker } from './composables/useDatepicker'

// Export core
export { createIosSelector } from './core/IosSelector'
export * from './core/easing'

// Plugin install function
const plugin: Plugin = {
  install(app: App) {
    app.component('IosDatepicker', IosDatepicker)
  },
}

export default plugin
