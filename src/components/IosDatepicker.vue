<script setup lang="ts">
import { ref, computed, watch, onMounted, toRef } from 'vue'
import type { DatePickerProps, DatePickerTheme, DateRange } from '../core/types'
import { useDatepicker } from '../composables/useDatepicker'
import '../styles/datepicker.css'

// Props with defaults
const props = withDefaults(defineProps<DatePickerProps>(), {
  modelValue: null,
  mode: 'date',
  range: false,
  locale: 'en',
  monthFormat: 'long',
  itemCount: 20,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  theme: 'light',
  disabled: false,
  minuteStep: 1,
  hourStep: 1,
  use24Hour: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | DateRange): void
  (e: 'change', value: Date | DateRange): void
  (e: 'confirm', value: Date | DateRange): void
  (e: 'cancel'): void
}>()

// Range mode state
const isSelectingEnd = ref(false)
const rangeStart = ref<Date | null>(null)
const rangeEnd = ref<Date | null>(null)

// DOM refs for selectors
const yearRef = ref<HTMLElement | null>(null)
const monthRef = ref<HTMLElement | null>(null)
const dayRef = ref<HTMLElement | null>(null)
const hourRef = ref<HTMLElement | null>(null)
const minuteRef = ref<HTMLElement | null>(null)
const ampmRef = ref<HTMLElement | null>(null)

// Use the composable
const {
  currentDate,
  visibleColumns,
  isInitialized,
  initSelectors,
  selectDate,
  reset,
  getCurrentValue,
} = useDatepicker({
  modelValue: toRef(props, 'modelValue'),
  minDate: toRef(props, 'min'),
  maxDate: toRef(props, 'max'),
  locale: toRef(props, 'locale'),
  monthFormat: toRef(props, 'monthFormat'),
  yearRange: toRef(props, 'yearRange'),
  minuteStep: toRef(props, 'minuteStep'),
  hourStep: toRef(props, 'hourStep'),
  use24Hour: toRef(props, 'use24Hour'),
  mode: toRef(props, 'mode'),
  itemCount: toRef(props, 'itemCount'),
  onChange: handleDateChange,
})

// Output value (single date or range)
const outputValue = computed<Date | DateRange>(() => {
  if (props.range) {
    return { start: rangeStart.value, end: rangeEnd.value }
  }
  return currentDate.value
})

// Theme configuration
const themeConfig = computed<DatePickerTheme>(() => {
  const lightTheme: DatePickerTheme = {
    background: '#f2f2f7',
    text: '#000000',
    textMuted: 'rgba(0, 0, 0, 0.3)',
    highlight: 'transparent',
    border: 'rgba(60, 60, 67, 0.29)',
    maskTop: 'rgba(242, 242, 247, 1)',
    maskBottom: 'rgba(242, 242, 247, 1)',
  }

  const darkTheme: DatePickerTheme = {
    background: '#1c1c1e',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.3)',
    highlight: 'transparent',
    border: 'rgba(84, 84, 88, 0.65)',
    maskTop: 'rgba(28, 28, 30, 1)',
    maskBottom: 'rgba(28, 28, 30, 1)',
  }

  if (props.theme === 'light') return lightTheme
  if (props.theme === 'dark') return darkTheme
  if (typeof props.theme === 'object') {
    return { ...lightTheme, ...props.theme }
  }
  return lightTheme
})

// CSS custom properties for theming
const cssVars = computed(() => ({
  '--ios-picker-background': themeConfig.value.background,
  '--ios-picker-text-color': themeConfig.value.text,
  '--ios-picker-text-muted': themeConfig.value.textMuted,
  '--ios-picker-selected-color': themeConfig.value.text,
  '--ios-picker-highlight-bg': themeConfig.value.highlight,
  '--ios-picker-highlight-border': themeConfig.value.border,
  '--ios-picker-mask-start': themeConfig.value.maskTop,
  '--ios-picker-mask-end': themeConfig.value.maskBottom?.replace('1)', '0)') || 'transparent',
}))

// Handlers
function handleDateChange(date: Date) {
  if (props.range) {
    if (isSelectingEnd.value) {
      rangeEnd.value = date
    } else {
      rangeStart.value = date
    }
  }
  emit('update:modelValue', outputValue.value)
  emit('change', outputValue.value)
}

function handleConfirm() {
  if (props.range && !isSelectingEnd.value && rangeStart.value) {
    isSelectingEnd.value = true
    return
  }
  emit('confirm', outputValue.value)
}

function handleCancel() {
  emit('cancel')
}

function initializeSelectors() {
  initSelectors({
    year: yearRef,
    month: monthRef,
    day: dayRef,
    hour: hourRef,
    minute: minuteRef,
    ampm: ampmRef,
  })
}

// Watch mode changes to reinitialize selectors
watch(
  () => props.mode,
  () => {
    setTimeout(initializeSelectors, 0)
  }
)

// Watch for initialization state
watch(isInitialized, (initialized) => {
  if (!initialized) {
    setTimeout(initializeSelectors, 0)
  }
})

// Initialize on mount
onMounted(() => {
  initializeSelectors()
})

// Expose methods for parent components
defineExpose({
  selectDate,
  reset,
  getCurrentValue,
})
</script>

<template>
  <div
    class="ios-datepicker"
    :class="{
      'ios-datepicker--disabled': disabled,
      'ios-datepicker--dark': theme === 'dark',
    }"
    :style="cssVars"
  >
    <!-- Range indicator -->
    <div v-if="range" class="ios-datepicker__range-indicator">
      <span :class="{ 'ios-datepicker__range-label--active': !isSelectingEnd }">
        {{ rangeStart ? 'Start' : 'Select Start' }}
      </span>
      <span class="ios-datepicker__range-arrow">→</span>
      <span :class="{ 'ios-datepicker__range-label--active': isSelectingEnd }">
        {{ rangeEnd ? 'End' : 'Select End' }}
      </span>
    </div>

    <!-- Picker columns -->
    <div class="ios-datepicker__container">
      <div
        v-if="visibleColumns.includes('month')"
        ref="monthRef"
        class="ios-datepicker__column ios-datepicker__column--month"
      ></div>
      <div
        v-if="visibleColumns.includes('day')"
        ref="dayRef"
        class="ios-datepicker__column ios-datepicker__column--day"
      ></div>
      <div
        v-if="visibleColumns.includes('year')"
        ref="yearRef"
        class="ios-datepicker__column ios-datepicker__column--year"
      ></div>
      <div
        v-if="visibleColumns.includes('hour')"
        ref="hourRef"
        class="ios-datepicker__column ios-datepicker__column--hour"
      ></div>
      <div
        v-if="visibleColumns.includes('minute')"
        ref="minuteRef"
        class="ios-datepicker__column ios-datepicker__column--minute"
      ></div>
      <div
        v-if="visibleColumns.includes('ampm')"
        ref="ampmRef"
        class="ios-datepicker__column ios-datepicker__column--ampm"
      ></div>
    </div>

    <!-- Action buttons -->
    <div v-if="confirmText || cancelText" class="ios-datepicker__actions">
      <button
        v-if="cancelText"
        type="button"
        class="ios-datepicker__btn ios-datepicker__btn--cancel"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
      <button
        v-if="confirmText"
        type="button"
        class="ios-datepicker__btn ios-datepicker__btn--confirm"
        @click="handleConfirm"
      >
        {{ range && !isSelectingEnd ? 'Next' : confirmText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/**
 * iOS Datepicker Component Styles (Scoped)
 *
 * Uses CSS custom properties from datepicker.css for theming.
 * Override variables at :root or on the component element.
 */

/* Main container */
.ios-datepicker {
  font-family: var(--ios-picker-font-family);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  width: 100%;
  max-width: 400px;
}

.ios-datepicker--disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Range indicator */
.ios-datepicker__range-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--ios-picker-text-muted);
}

.ios-datepicker__range-label--active {
  color: var(--ios-picker-text-color);
  font-weight: 600;
}

.ios-datepicker__range-arrow {
  color: var(--ios-picker-text-muted);
}

/* Picker container */
.ios-datepicker__container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: var(--ios-picker-background);
  border-radius: var(--ios-picker-border-radius);
  overflow: hidden;
  padding: var(--ios-picker-padding);
  gap: var(--ios-picker-column-gap);
  perspective: 1000px;
  height: 220px;
}

/* Column styles */
.ios-datepicker__column {
  flex: 1;
  position: relative;
  min-width: 50px;
  height: 100%;
}

.ios-datepicker__column--month {
  max-width: 140px;
}

.ios-datepicker__column--day,
.ios-datepicker__column--year {
  max-width: 80px;
}

.ios-datepicker__column--hour,
.ios-datepicker__column--minute {
  max-width: 60px;
}

.ios-datepicker__column--ampm {
  max-width: 50px;
}

/* Action buttons */
.ios-datepicker__actions {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
}

.ios-datepicker__btn {
  flex: 1;
  padding: var(--ios-picker-btn-padding);
  border: none;
  border-radius: var(--ios-picker-btn-border-radius);
  font-family: var(--ios-picker-font-family);
  font-size: var(--ios-picker-btn-font-size);
  font-weight: var(--ios-picker-btn-font-weight);
  cursor: pointer;
  transition: opacity var(--ios-picker-transition-duration) ease;
}

.ios-datepicker__btn:active {
  opacity: 0.7;
}

.ios-datepicker__btn:focus {
  outline: none;
}

.ios-datepicker__btn:focus-visible {
  outline: 2px solid var(--ios-picker-btn-color);
  outline-offset: 2px;
}

.ios-datepicker__btn--cancel {
  background: var(--ios-picker-btn-bg);
  color: var(--ios-picker-btn-color);
}

.ios-datepicker__btn--confirm {
  background: var(--ios-picker-btn-confirm-bg);
  color: var(--ios-picker-btn-confirm-color);
}
</style>

<style>
/**
 * Non-scoped styles for deep selector styling
 * These target the dynamically created iOS selector elements
 */

.ios-datepicker .ios-selector-wrapper {
  background: transparent;
}

.ios-datepicker .ios-selector-item {
  color: var(--ios-picker-text-color);
}

.ios-datepicker .ios-selector-highlight {
  background: var(--ios-picker-highlight-bg);
  border-color: var(--ios-picker-highlight-border);
}

.ios-datepicker .ios-selector-mask-top {
  background: linear-gradient(
    to bottom,
    var(--ios-picker-mask-start) 0%,
    var(--ios-picker-mask-end) 100%
  );
}

.ios-datepicker .ios-selector-mask-bottom {
  background: linear-gradient(
    to top,
    var(--ios-picker-mask-start) 0%,
    var(--ios-picker-mask-end) 100%
  );
}
</style>
