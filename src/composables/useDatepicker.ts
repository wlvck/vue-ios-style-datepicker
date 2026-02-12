import { ref, computed, watch, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import type {
  SelectorOption,
  DateRange,
  IosSelectorInstance,
  ColumnType,
  DatePickerMode,
} from '../core/types'
import { createIosSelector } from '../core/IosSelector'
import {
  getYears,
  getMonths,
  getDays,
  getHours,
  getMinutes,
  getAmPm,
  getDaysInMonth,
  clampDate,
  isValidDate,
} from '../utils/date'

// ============================================================================
// Types
// ============================================================================

export interface UseDatepickerOptions {
  /** Reactive model value (Date or DateRange) */
  modelValue: Ref<Date | DateRange | null | undefined>
  /** Minimum date constraint */
  minDate?: Ref<Date | undefined>
  /** Maximum date constraint */
  maxDate?: Ref<Date | undefined>
  /** Locale for month names */
  locale?: Ref<string>
  /** Year range [start, end] */
  yearRange?: Ref<[number, number] | undefined>
  /** Minute step interval */
  minuteStep?: Ref<number>
  /** Hour step interval */
  hourStep?: Ref<number>
  /** Use 24-hour format */
  use24Hour?: Ref<boolean>
  /** Picker mode */
  mode?: Ref<DatePickerMode>
  /** Number of visible items in wheel */
  itemCount?: Ref<number>
  /** Callback when date changes */
  onChange?: (date: Date) => void
}

export interface SelectorRefs {
  year?: Ref<HTMLElement | null>
  month?: Ref<HTMLElement | null>
  day?: Ref<HTMLElement | null>
  hour?: Ref<HTMLElement | null>
  minute?: Ref<HTMLElement | null>
  ampm?: Ref<HTMLElement | null>
}

export interface UseDatepickerReturn {
  // State
  selectedYear: Ref<number>
  selectedMonth: Ref<number>
  selectedDay: Ref<number>
  selectedHour: Ref<number>
  selectedMinute: Ref<number>
  selectedAmPm: Ref<number>
  currentDate: ComputedRef<Date>
  isInitialized: Ref<boolean>

  // Options (computed)
  yearOptions: ComputedRef<SelectorOption[]>
  monthOptions: ComputedRef<SelectorOption[]>
  dayOptions: ComputedRef<SelectorOption[]>
  hourOptions: ComputedRef<SelectorOption[]>
  minuteOptions: ComputedRef<SelectorOption[]>
  ampmOptions: ComputedRef<SelectorOption[]>
  visibleColumns: ComputedRef<ColumnType[]>

  // Selector Management
  initSelectors: (refs: SelectorRefs) => void
  destroySelectors: () => void
  updateSelectorValues: () => void

  // Public Methods
  selectDate: (date: Date) => void
  reset: () => void
  getCurrentValue: () => Date
  setColumn: (column: ColumnType, value: number) => void
}

// ============================================================================
// Composable
// ============================================================================

export function useDatepicker(options: UseDatepickerOptions): UseDatepickerReturn {
  const {
    modelValue,
    minDate,
    maxDate,
    locale,
    yearRange,
    minuteStep,
    hourStep,
    use24Hour,
    mode,
    itemCount,
    onChange,
  } = options

  // ============================================================================
  // Internal State
  // ============================================================================

  const isInitialized = ref(false)
  const initialDate = ref<Date>(new Date())

  // Selected values
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth())
  const selectedDay = ref(new Date().getDate())
  const selectedHour = ref(new Date().getHours())
  const selectedMinute = ref(0)
  const selectedAmPm = ref(new Date().getHours() >= 12 ? 1 : 0)

  // Selector instances map
  const selectors = new Map<ColumnType, IosSelectorInstance>()

  // Track if we're in the middle of an update to prevent loops
  let isUpdating = false

  // ============================================================================
  // Computed: Year Range
  // ============================================================================

  const yearRangeComputed = computed<[number, number]>(() => {
    if (yearRange?.value) return yearRange.value
    const currentYear = new Date().getFullYear()
    return [currentYear - 50, currentYear + 50]
  })

  // ============================================================================
  // Computed: Options for each column
  // ============================================================================

  const yearOptions = computed<SelectorOption[]>(() => {
    return getYears(yearRangeComputed.value[0], yearRangeComputed.value[1])
  })

  const monthOptions = computed<SelectorOption[]>(() => {
    return getMonths(locale?.value || 'en', 'long')
  })

  const dayOptions = computed<SelectorOption[]>(() => {
    return getDays(selectedYear.value, selectedMonth.value)
  })

  const hourOptions = computed<SelectorOption[]>(() => {
    const is24 = use24Hour?.value ?? true
    const step = hourStep?.value || 1
    const hours = getHours(is24)
    if (step === 1) return hours
    return hours.filter((_, i) => i % step === 0)
  })

  const minuteOptions = computed<SelectorOption[]>(() => {
    return getMinutes(minuteStep?.value || 1)
  })

  const ampmOptions = computed<SelectorOption[]>(() => {
    return getAmPm()
  })

  // ============================================================================
  // Computed: Visible columns based on mode
  // ============================================================================

  const visibleColumns = computed<ColumnType[]>(() => {
    const pickerMode = mode?.value || 'date'
    const is24 = use24Hour?.value ?? true

    switch (pickerMode) {
      case 'date':
        return ['month', 'day', 'year']
      case 'datetime':
        return is24
          ? ['month', 'day', 'year', 'hour', 'minute']
          : ['month', 'day', 'year', 'hour', 'minute', 'ampm']
      case 'time':
        return is24 ? ['hour', 'minute'] : ['hour', 'minute', 'ampm']
      case 'year-month':
        return ['month', 'year']
      default:
        return ['month', 'day', 'year']
    }
  })

  // ============================================================================
  // Computed: Current date from selections
  // ============================================================================

  const currentDate = computed<Date>(() => {
    let hours = selectedHour.value
    const is24 = use24Hour?.value ?? true

    if (!is24) {
      if (selectedAmPm.value === 1 && hours < 12) {
        hours += 12
      } else if (selectedAmPm.value === 0 && hours === 12) {
        hours = 0
      }
    }

    return new Date(
      selectedYear.value,
      selectedMonth.value,
      selectedDay.value,
      hours,
      selectedMinute.value
    )
  })

  // ============================================================================
  // Internal Methods
  // ============================================================================

  function extractDateValues(date: Date) {
    const is24 = use24Hour?.value ?? true
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: is24 ? date.getHours() : date.getHours() % 12 || 12,
      minute: date.getMinutes(),
      ampm: date.getHours() >= 12 ? 1 : 0,
    }
  }

  function setValuesFromDate(date: Date) {
    const values = extractDateValues(date)
    selectedYear.value = values.year
    selectedMonth.value = values.month
    selectedDay.value = values.day
    selectedHour.value = values.hour
    selectedMinute.value = values.minute
    selectedAmPm.value = values.ampm
  }

  function initializeFromModelValue() {
    const value = modelValue.value

    if (value instanceof Date && isValidDate(value)) {
      initialDate.value = new Date(value)
      setValuesFromDate(value)
    } else if (value && typeof value === 'object' && 'start' in value) {
      const rangeValue = value as DateRange
      if (rangeValue.start && isValidDate(rangeValue.start)) {
        initialDate.value = new Date(rangeValue.start)
        setValuesFromDate(rangeValue.start)
      }
    }
  }

  function clampToConstraints() {
    const clamped = clampDate(currentDate.value, minDate?.value, maxDate?.value)
    if (clamped.getTime() !== currentDate.value.getTime()) {
      setValuesFromDate(clamped)
      updateSelectorValues()
    }
  }

  function emitChange() {
    if (isUpdating) return
    clampToConstraints()
    onChange?.(currentDate.value)
  }

  function handleColumnChange(column: ColumnType, option: SelectorOption) {
    isUpdating = true

    switch (column) {
      case 'year':
        selectedYear.value = option.value
        break
      case 'month':
        selectedMonth.value = option.value
        break
      case 'day':
        selectedDay.value = option.value
        break
      case 'hour':
        selectedHour.value = option.value
        break
      case 'minute':
        selectedMinute.value = option.value
        break
      case 'ampm':
        selectedAmPm.value = option.value
        break
    }

    isUpdating = false
    emitChange()
  }

  // ============================================================================
  // Selector Management
  // ============================================================================

  function createSelectorInstance(
    el: HTMLElement,
    column: ColumnType,
    options: SelectorOption[],
    value: number,
    isInfinite: boolean
  ): IosSelectorInstance {
    const selector = createIosSelector({
      el,
      type: isInfinite ? 'infinite' : 'normal',
      count: itemCount?.value || 5,
      sensitivity: 0.8,
      source: options,
      value,
      onChange: (selected) => handleColumnChange(column, selected),
    })
    selectors.set(column, selector)
    return selector
  }

  function initSelectors(refs: SelectorRefs) {
    // Destroy existing selectors first
    destroySelectors()

    const columns = visibleColumns.value

    // Year selector (normal - not infinite)
    if (columns.includes('year') && refs.year?.value) {
      createSelectorInstance(refs.year.value, 'year', yearOptions.value, selectedYear.value, false)
    }

    // Month selector (infinite)
    if (columns.includes('month') && refs.month?.value) {
      createSelectorInstance(
        refs.month.value,
        'month',
        monthOptions.value,
        selectedMonth.value,
        true
      )
    }

    // Day selector (infinite)
    if (columns.includes('day') && refs.day?.value) {
      createSelectorInstance(refs.day.value, 'day', dayOptions.value, selectedDay.value, true)
    }

    // Hour selector (infinite)
    if (columns.includes('hour') && refs.hour?.value) {
      createSelectorInstance(refs.hour.value, 'hour', hourOptions.value, selectedHour.value, true)
    }

    // Minute selector (infinite)
    if (columns.includes('minute') && refs.minute?.value) {
      createSelectorInstance(
        refs.minute.value,
        'minute',
        minuteOptions.value,
        selectedMinute.value,
        true
      )
    }

    // AM/PM selector (normal - not infinite)
    if (columns.includes('ampm') && refs.ampm?.value) {
      createSelectorInstance(refs.ampm.value, 'ampm', ampmOptions.value, selectedAmPm.value, false)
    }

    isInitialized.value = true
  }

  function destroySelectors() {
    selectors.forEach((selector) => {
      try {
        selector.destroy()
      } catch {
        // Ignore cleanup errors
      }
    })
    selectors.clear()
    isInitialized.value = false
  }

  function updateSelectorValues() {
    selectors.get('year')?.select(selectedYear.value)
    selectors.get('month')?.select(selectedMonth.value)
    selectors.get('day')?.select(selectedDay.value)
    selectors.get('hour')?.select(selectedHour.value)
    selectors.get('minute')?.select(selectedMinute.value)
    selectors.get('ampm')?.select(selectedAmPm.value)
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Programmatically select a date
   */
  function selectDate(date: Date) {
    if (!isValidDate(date)) return

    const clamped = clampDate(date, minDate?.value, maxDate?.value)
    setValuesFromDate(clamped)
    updateSelectorValues()
    onChange?.(clamped)
  }

  /**
   * Reset to initial value or current date
   */
  function reset() {
    const resetDate = initialDate.value || new Date()
    setValuesFromDate(resetDate)
    updateSelectorValues()
    onChange?.(resetDate)
  }

  /**
   * Get the current selected value
   */
  function getCurrentValue(): Date {
    return currentDate.value
  }

  /**
   * Set a specific column value
   */
  function setColumn(column: ColumnType, value: number) {
    handleColumnChange(column, { value, label: String(value) })
    selectors.get(column)?.select(value)
  }

  // ============================================================================
  // Watchers
  // ============================================================================

  // Watch for external modelValue changes
  watch(
    () => modelValue.value,
    () => {
      if (!isUpdating) {
        initializeFromModelValue()
        updateSelectorValues()
      }
    },
    { deep: true }
  )

  // Adjust day when month/year changes (handle months with different day counts)
  watch([selectedYear, selectedMonth], () => {
    const daysInMonth = getDaysInMonth(selectedYear.value, selectedMonth.value)
    if (selectedDay.value > daysInMonth) {
      selectedDay.value = daysInMonth
      selectors.get('day')?.select(daysInMonth)
    }
    // Update day options in selector
    selectors.get('day')?.updateSource(dayOptions.value)
  })

  // Watch mode changes
  watch(
    () => mode?.value,
    () => {
      // Mode changed - selectors need to be reinitialized by the component
      isInitialized.value = false
    }
  )

  // Cleanup on unmount
  onBeforeUnmount(() => {
    destroySelectors()
  })

  // Initialize from model value
  initializeFromModelValue()

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedHour,
    selectedMinute,
    selectedAmPm,
    currentDate,
    isInitialized,

    // Options
    yearOptions,
    monthOptions,
    dayOptions,
    hourOptions,
    minuteOptions,
    ampmOptions,
    visibleColumns,

    // Selector Management
    initSelectors,
    destroySelectors,
    updateSelectorValues,

    // Public Methods
    selectDate,
    reset,
    getCurrentValue,
    setColumn,
  }
}
