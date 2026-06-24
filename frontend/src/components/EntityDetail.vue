<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    default: null,
  },
})

const propertyRows = computed(() => {
  if (!props.node) return []

  return Object.entries(props.node.rawProperties ?? {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      label: formatLabel(key),
      value: formatValue(value),
    }))
})

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === '') return 'Unknown'
  return String(value)
}
</script>

<template>
  <section>
    <h2 class="va-panel-title">Selected entity</h2>
    <div v-if="node" class="va-detail-box mt-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-base font-semibold text-slate-950">{{ node.label }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ node.nodeType }}</p>
        </div>
        <span class="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
          Observed record
        </span>
      </div>

      <dl class="mt-3 divide-y divide-slate-200 border-t border-slate-200 text-sm">
        <div class="grid grid-cols-[0.8fr_1.2fr] gap-3 py-2">
          <dt class="text-slate-500">Source id</dt>
          <dd class="break-all font-medium text-slate-800">{{ node.rawId }}</dd>
        </div>
        <div
          v-for="row in propertyRows"
          :key="row.key"
          class="grid grid-cols-[0.8fr_1.2fr] gap-3 py-2"
        >
          <dt class="text-slate-500">{{ row.label }}</dt>
          <dd class="break-words font-medium text-slate-800">{{ row.value }}</dd>
        </div>
      </dl>
      <p v-if="!propertyRows.length" class="mt-3 text-sm leading-6 text-slate-500">
        This source record contains no additional properties beyond name and entity type.
      </p>
    </div>
  </section>
</template>
