// Picker modes
export type DatePickerMode = 'date' | 'datetime' | 'time' | 'year-month'

// Month name format
export type MonthFormat = 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'

// Theme configuration
export interface DatePickerTheme {
  background?: string
  text?: string
  textMuted?: string
  highlight?: string
  border?: string
  maskTop?: string
  maskBottom?: string
}

// Date range value
export interface DateRange {
  start: Date | null
  end: Date | null
}

// Main component props
export interface DatePickerProps {
  // Value binding
  modelValue?: Date | DateRange | null

  // Mode configuration
  mode?: DatePickerMode
  range?: boolean

  // Constraints
  min?: Date
  max?: Date

  // Display options
  format?: string
  locale?: string
  monthFormat?: MonthFormat
  yearRange?: [number, number]
  itemCount?: number

  // Button text
  confirmText?: string
  cancelText?: string

  // Appearance
  theme?: 'light' | 'dark' | DatePickerTheme
  disabled?: boolean

  // Time options
  minuteStep?: number
  hourStep?: number
  use24Hour?: boolean
}

// Component emits
export interface DatePickerEmits {
  (e: 'update:modelValue', value: Date | DateRange): void
  (e: 'change', value: Date | DateRange): void
  (e: 'confirm', value: Date | DateRange): void
  (e: 'cancel'): void
}

// Selector option for wheels
export interface SelectorOption {
  value: number
  label: string
}

// iOS Selector configuration
export interface IosSelectorConfig {
  el: HTMLElement
  type: 'infinite' | 'normal'
  count: number
  sensitivity: number
  source: SelectorOption[]
  value?: number
  onChange?: (selected: SelectorOption) => void
}

// iOS Selector instance methods
export interface IosSelectorInstance {
  select: (value: number) => void
  getValue: () => number
  destroy: () => void
  updateSource: (source: SelectorOption[]) => void
}

// Easing function type
export type EasingFunction = (t: number) => number

// Internal column types
export type ColumnType = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'ampm'
