<script setup>
import { computed } from 'vue'

const props = defineProps({
  overview: {
    type: Object,
    required: true,
  },
  fullOverview: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const rows = computed(() => [
  {
    label: 'Entities retained',
    visible: props.overview.totalNodes,
    total: props.fullOverview.totalNodes,
  },
  {
    label: 'Relationships retained',
    visible: props.overview.totalLinks,
    total: props.fullOverview.totalLinks,
  },
])

function percentage(row) {
  return row.total ? (row.visible / row.total) * 100 : 0
}
</script>

<template>
  <section v-if="active" class="va-card va-card-pad">
    <div class="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 class="va-panel-title">Filter impact</h2>
        <p class="va-panel-copy mt-1">Current subset compared with the complete graph.</p>
      </div>
      <p class="text-xs text-slate-500">Observed counts after applying all active filters</p>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div v-for="row in rows" :key="row.label">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="font-medium text-slate-700">{{ row.label }}</span>
          <span class="tabular-nums text-slate-600">
            {{ row.visible.toLocaleString() }} / {{ row.total.toLocaleString() }}
          </span>
        </div>
        <div class="mt-2 h-2 bg-slate-100">
          <div
            class="h-full bg-blue-600"
            :style="{ width: `${percentage(row)}%` }"
          />
        </div>
        <p class="mt-1 text-xs tabular-nums text-slate-500">
          {{ percentage(row).toFixed(1) }}% retained,
          {{ (row.total - row.visible).toLocaleString() }} removed
        </p>
      </div>
    </div>
  </section>
</template>
