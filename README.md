# vue-ios-style-datepicker

[![npm version](https://img.shields.io/npm/v/vue-ios-style-datepicker.svg)](https://www.npmjs.com/package/vue-ios-style-datepicker)
[![license](https://img.shields.io/npm/l/vue-ios-style-datepicker.svg)](https://github.com/wlvck/vue3-ios-datepicker/blob/main/LICENSE)
[![vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![typescript](https://img.shields.io/badge/typescript-supported-blue.svg)](https://www.typescriptlang.org/)

A beautiful iOS-style scroll wheel datepicker component for Vue 3 with TypeScript support. Features smooth touch gestures, momentum scrolling, and customizable themes.

<p align="center">
  <img src="https://raw.githubusercontent.com/wlvck/vue3-ios-datepicker/main/demo.gif" alt="Demo" width="300" />
</p>

## ✨ Features

- 🎯 **iOS Native Feel** - Smooth scroll wheel with momentum and snap
- 📱 **Touch Optimized** - Native touch gestures with mouse wheel support
- 🎨 **Themeable** - Light/dark themes with CSS custom properties
- 📅 **Multiple Modes** - Date, datetime, time, and year-month pickers
- 📆 **Date Range** - Support for selecting date ranges
- 🌍 **Locale Support** - Internationalized month names via Intl API
- 💪 **TypeScript** - Full TypeScript support with type declarations
- 🪶 **Lightweight** - ~7KB gzipped with no dependencies

## 📦 Installation

```bash
# npm
npm install vue-ios-style-datepicker

# yarn
yarn add vue-ios-style-datepicker

# pnpm
pnpm add vue-ios-style-datepicker
```

## 🚀 Quick Start

### Global Registration

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import IosDatepicker from 'vue-ios-style-datepicker'
import 'vue-ios-style-datepicker/style.css'

const app = createApp(App)
app.use(IosDatepicker)
app.mount('#app')
```

### Local Registration

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { IosDatepicker } from 'vue-ios-style-datepicker'
import 'vue-ios-style-datepicker/style.css'

const selectedDate = ref(new Date())
</script>

<template>
  <IosDatepicker v-model="selectedDate" />
</template>
```

### CDN Usage

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/vue-ios-style-datepicker/dist/vue-ios-style-datepicker.css"
/>
<script src="https://unpkg.com/vue"></script>
<script src="https://unpkg.com/vue-ios-style-datepicker"></script>

<script>
  const app = Vue.createApp({
    data() {
      return { date: new Date() }
    },
  })
  app.use(Vue3IosDatepicker)
  app.mount('#app')
</script>
```

## 📖 Examples

### Basic Date Picker

```vue
<template>
  <IosDatepicker v-model="date" />
</template>
```

### DateTime Picker

```vue
<template>
  <IosDatepicker v-model="date" mode="datetime" :use24Hour="false" />
</template>
```

### Time Picker

```vue
<template>
  <IosDatepicker v-model="date" mode="time" :minuteStep="5" />
</template>
```

### Year-Month Picker

```vue
<template>
  <IosDatepicker v-model="date" mode="year-month" />
</template>
```

### Date Range Picker

```vue
<script setup>
import { ref } from 'vue'

const dateRange = ref({
  start: null,
  end: null,
})
</script>

<template>
  <IosDatepicker v-model="dateRange" range />
</template>
```

### With Min/Max Constraints

```vue
<script setup>
import { ref } from 'vue'

const date = ref(new Date())
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)
</script>

<template>
  <IosDatepicker v-model="date" :min="minDate" :max="maxDate" />
</template>
```

### Dark Theme

```vue
<template>
  <IosDatepicker v-model="date" theme="dark" />
</template>
```

### Custom Theme

```vue
<template>
  <IosDatepicker
    v-model="date"
    :theme="{
      background: '#1a1a2e',
      text: '#eaeaea',
      border: '#4a4a6a',
      maskTop: 'rgba(26, 26, 46, 1)',
      maskBottom: 'rgba(26, 26, 46, 1)',
    }"
  />
</template>
```

### Localized Month Names

```vue
<template>
  <!-- Spanish -->
  <IosDatepicker v-model="date" locale="es" />

  <!-- Japanese -->
  <IosDatepicker v-model="date" locale="ja" />

  <!-- German -->
  <IosDatepicker v-model="date" locale="de" />
</template>
```

### Custom Buttons

```vue
<template>
  <IosDatepicker
    v-model="date"
    confirmText="OK"
    cancelText="Cancel"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
```

### Programmatic Control

```vue
<script setup>
import { ref } from 'vue'

const pickerRef = ref()

function goToToday() {
  pickerRef.value?.selectDate(new Date())
}

function resetPicker() {
  pickerRef.value?.reset()
}
</script>

<template>
  <IosDatepicker ref="pickerRef" v-model="date" />
  <button @click="goToToday">Today</button>
  <button @click="resetPicker">Reset</button>
</template>
```

## 📋 Props

| Prop          | Type                                             | Default      | Description                          |
| ------------- | ------------------------------------------------ | ------------ | ------------------------------------ |
| `modelValue`  | `Date \| DateRange \| null`                      | `null`       | Selected date value (v-model)        |
| `mode`        | `'date' \| 'datetime' \| 'time' \| 'year-month'` | `'date'`     | Picker mode                          |
| `range`       | `boolean`                                        | `false`      | Enable date range selection          |
| `min`         | `Date`                                           | -            | Minimum selectable date              |
| `max`         | `Date`                                           | -            | Maximum selectable date              |
| `locale`      | `string`                                         | `'en'`       | BCP 47 locale for month names        |
| `yearRange`   | `[number, number]`                               | `[-50, +50]` | Year range relative to current year  |
| `itemCount`   | `number`                                         | `5`          | Number of visible items in wheel     |
| `confirmText` | `string`                                         | `'Confirm'`  | Confirm button text (empty to hide)  |
| `cancelText`  | `string`                                         | `'Cancel'`   | Cancel button text (empty to hide)   |
| `theme`       | `'light' \| 'dark' \| ThemeObject`               | `'light'`    | Color theme                          |
| `disabled`    | `boolean`                                        | `false`      | Disable the picker                   |
| `minuteStep`  | `number`                                         | `1`          | Minute interval (1, 5, 10, 15, etc.) |
| `hourStep`    | `number`                                         | `1`          | Hour interval                        |
| `use24Hour`   | `boolean`                                        | `true`       | Use 24-hour format                   |

### Theme Object

```typescript
interface DatePickerTheme {
  background?: string // Picker background color
  text?: string // Text color
  textMuted?: string // Muted text color
  highlight?: string // Highlight row background
  border?: string // Highlight row border
  maskTop?: string // Top gradient mask color
  maskBottom?: string // Bottom gradient mask color
}
```

### DateRange Type

```typescript
interface DateRange {
  start: Date | null
  end: Date | null
}
```

## 📡 Events

| Event               | Payload             | Description                            |
| ------------------- | ------------------- | -------------------------------------- |
| `update:modelValue` | `Date \| DateRange` | Emitted when value changes (v-model)   |
| `change`            | `Date \| DateRange` | Emitted when any selection changes     |
| `confirm`           | `Date \| DateRange` | Emitted when confirm button is clicked |
| `cancel`            | -                   | Emitted when cancel button is clicked  |

```vue
<template>
  <IosDatepicker v-model="date" @change="onDateChange" @confirm="onConfirm" @cancel="onCancel" />
</template>

<script setup>
function onDateChange(date) {
  console.log('Date changed:', date)
}

function onConfirm(date) {
  console.log('Confirmed:', date)
}

function onCancel() {
  console.log('Cancelled')
}
</script>
```

## 🎨 Theming & Customization

### CSS Custom Properties

Override these CSS variables to customize the appearance:

```css
:root {
  /* Colors */
  --ios-picker-background: #f2f2f7;
  --ios-picker-text-color: #000000;
  --ios-picker-text-muted: rgba(0, 0, 0, 0.3);
  --ios-picker-selected-color: #000000;
  --ios-picker-highlight-bg: transparent;
  --ios-picker-highlight-border: rgba(60, 60, 67, 0.29);
  --ios-picker-mask-start: rgba(242, 242, 247, 1);
  --ios-picker-mask-end: rgba(242, 242, 247, 0);

  /* Typography */
  --ios-picker-font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  --ios-picker-font-size: 20px;
  --ios-picker-font-weight: 400;

  /* Sizing */
  --ios-picker-item-height: 36px;
  --ios-picker-border-radius: 12px;
  --ios-picker-column-gap: 0px;
  --ios-picker-padding: 0 8px;

  /* Buttons */
  --ios-picker-btn-color: #007aff;
  --ios-picker-btn-bg: transparent;
  --ios-picker-btn-confirm-color: #ffffff;
  --ios-picker-btn-confirm-bg: #007aff;
  --ios-picker-btn-font-size: 16px;
  --ios-picker-btn-padding: 12px 24px;
  --ios-picker-btn-border-radius: 10px;

  /* Animation */
  --ios-picker-transition-duration: 0.3s;
  --ios-picker-transition-easing: cubic-bezier(0.23, 1, 0.32, 1);
}
```

### Per-Instance Styling

```vue
<template>
  <IosDatepicker v-model="date" class="my-custom-picker" />
</template>

<style>
.my-custom-picker {
  --ios-picker-background: #ffffff;
  --ios-picker-text-color: #333333;
  --ios-picker-highlight-border: #007aff;
  --ios-picker-btn-confirm-bg: #34c759;
}
</style>
```

### Dark Mode

The component automatically adapts to system dark mode via `prefers-color-scheme`. You can also force dark mode:

```vue
<template>
  <IosDatepicker v-model="date" theme="dark" />
</template>
```

Or with CSS:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ios-picker-background: #1c1c1e;
    --ios-picker-text-color: #ffffff;
    --ios-picker-highlight-border: rgba(84, 84, 88, 0.65);
    --ios-picker-mask-start: rgba(28, 28, 30, 1);
  }
}
```

## 🔧 Composable

For advanced use cases, you can use the `useDatepicker` composable directly:

```typescript
import { ref } from 'vue'
import { useDatepicker } from 'vue-ios-style-datepicker'

const modelValue = ref(new Date())

const {
  currentDate,
  selectedYear,
  selectedMonth,
  selectedDay,
  selectDate,
  reset,
  getCurrentValue,
} = useDatepicker({
  modelValue,
  locale: ref('en'),
  mode: ref('date'),
  onChange: (date) => console.log('Changed:', date),
})
```

## 🛠️ Utilities

The package also exports useful date utilities:

```typescript
import {
  getYears,
  getMonths,
  getDays,
  getDaysInMonth,
  formatDate,
  parseDate,
  isValidDate,
  clampDate,
} from 'vue-ios-style-datepicker'

// Generate year options
const years = getYears(2020, 2030)
// [{ value: 2020, label: '2020' }, ...]

// Get localized month names
const months = getMonths('es', 'long')
// [{ value: 0, label: 'enero' }, ...]

// Format date
const formatted = formatDate(new Date(), 'YYYY-MM-DD')
// '2024-02-12'

// Parse date string
const date = parseDate('2024-02-12', 'YYYY-MM-DD')
// Date object
```

## 🌐 Browser Support

| Browser        | Version |
| -------------- | ------- |
| Chrome         | 80+     |
| Firefox        | 75+     |
| Safari         | 13.1+   |
| Edge           | 80+     |
| iOS Safari     | 13.4+   |
| Android Chrome | 80+     |

## 📄 TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  DatePickerProps,
  DatePickerTheme,
  DatePickerMode,
  DateRange,
  SelectorOption,
} from 'vue-ios-style-datepicker'
```

## 📝 License

[MIT](./LICENSE) License © 2024 [Zhumagali Kanagat](https://github.com/wlvck)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💖 Support

If you find this package useful, please consider giving it a ⭐ on [GitHub](https://github.com/wlvck/vue3-ios-datepicker)!
