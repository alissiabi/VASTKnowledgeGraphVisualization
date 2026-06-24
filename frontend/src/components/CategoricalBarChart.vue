<script setup>
import * as d3 from 'd3'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  rows: {
    type: Array,
    required: true,
  },
  selected: {
    type: String,
    default: '',
  },
  limit: {
    type: Number,
    default: 8,
  },
  color: {
    type: String,
    default: '#4477aa',
  },
  expandable: {
    type: Boolean,
    default: false,
  },
  expandLabel: {
    type: String,
    default: 'Show all',
  },
})

const emit = defineEmits(['select'])
const expanded = ref(false)

watch(
  () => props.rows,
  () => {
    if (!props.expandable) expanded.value = false
  },
)

const chartRows = computed(() => {
  const visibleRows =
    props.expandable && expanded.value ? props.rows : props.rows.slice(0, props.limit)
  const maxValue = d3.max(visibleRows, (row) => row.value) ?? 1
  const widthScale = d3.scaleLinear().domain([0, maxValue]).range([0, 100])

  return visibleRows.map((row) => ({
    ...row,
    share: widthScale(row.value),
  }))
})

function selectRow(row) {
  if (row.isAggregate) return
  emit('select', props.selected === row.label ? '' : row.label)
}
</script>

<template>
  <article class="va-card va-card-pad flex h-full min-h-0 flex-col">
    <div>
      <h2 class="va-panel-title">{{ title }}</h2>
      <p v-if="subtitle" class="va-panel-copy mt-1">{{ subtitle }}</p>
    </div>

    <div class="mt-4 divide-y divide-slate-100">
      <button
        v-for="(row, index) in chartRows"
        :key="row.label"
        type="button"
        class="grid w-full min-w-0 grid-cols-[1.25rem_minmax(0,1fr)_minmax(4.5rem,0.72fr)_auto] items-center gap-2 border-l-2 px-1 py-2.5 text-left transition"
        :class="{
          'border-blue-600 bg-blue-50': selected === row.label,
          'border-transparent hover:bg-slate-50': selected !== row.label,
        }"
        @click="selectRow(row)"
      >
        <span class="text-xs tabular-nums text-slate-400">{{ index + 1 }}</span>
        <span class="truncate text-xs font-medium text-slate-800" :title="row.label">
          {{ row.label }}
        </span>
        <span class="relative block h-2 bg-slate-100">
          <div
            class="absolute inset-y-0 left-0"
            :style="{ width: `${row.share}%`, backgroundColor: color }"
          />
        </span>
        <span class="min-w-[3.5rem] text-right text-xs tabular-nums text-slate-600">
          {{ row.value.toLocaleString() }}
        </span>
      </button>
    </div>

    <button
      v-if="expandable && rows.length > limit"
      type="button"
      class="va-button mt-3 w-full"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show top 5' : `${expandLabel} (${rows.length})` }}
    </button>
  </article>
</template>
