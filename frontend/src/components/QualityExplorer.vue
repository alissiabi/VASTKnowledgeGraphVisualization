<script setup>
import * as d3 from 'd3'
import { computed, ref } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  signals: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['inspect-link'])

const activeSignal = ref('chronology')
const expanded = ref(false)
const previewLimit = 14

const signalOptions = computed(() => [
  {
    key: 'chronology',
    label: 'Chronology checks',
    description: 'Influence-style source work predates its target work.',
    count: props.signals.chronology.count,
  },
  {
    key: 'missingYears',
    label: 'Missing temporal context',
    description: 'Influence-style relationship lacks one or both endpoint release years.',
    count: props.signals.missingYears.count,
  },
  {
    key: 'duplicates',
    label: 'Duplicate records',
    description: 'Same source, relationship type, and target occur more than once.',
    count: props.signals.duplicates.count,
  },
])
const activeOption = computed(
  () => signalOptions.value.find((option) => option.key === activeSignal.value),
)
const activeRows = computed(() => props.signals[activeSignal.value].rows)
const visibleRows = computed(() =>
  expanded.value ? activeRows.value : activeRows.value.slice(0, previewLimit),
)
const shownLabel = computed(
  () => `${d3.format(',')(visibleRows.value.length)} of ${d3.format(',')(activeRows.value.length)} records`,
)

function selectSignal(key) {
  activeSignal.value = key
  expanded.value = false
}
</script>

<template>
  <article class="va-card va-card-pad flex h-full flex-col">
    <div>
      <div class="flex items-center gap-1.5">
        <h2 class="va-panel-title">Evidence Audit</h2>
        <InfoTooltip
          text="Audit signals are derived checks, not automatic error labels. Use them to decide which observed records need contextual review."
        />
      </div>
      <p class="va-panel-copy mt-1">
        Records that deserve verification before interpretation.
      </p>
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-3">
      <button
        v-for="option in signalOptions"
        :key="option.key"
        type="button"
        class="rounded border p-3 text-left transition"
        :class="
          activeSignal === option.key
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        "
        @click="selectSignal(option.key)"
      >
        <span class="block text-xs font-semibold text-slate-700">{{ option.label }}</span>
        <span class="mt-1 block text-xl font-semibold tabular-nums text-slate-950">
          {{ option.count.toLocaleString() }}
        </span>
      </button>
    </div>

    <div class="mt-4 flex-1 border-t border-slate-200 pt-4">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">{{ activeOption.label }}</h3>
          <p class="mt-1 text-xs leading-5 text-slate-500">{{ activeOption.description }}</p>
        </div>
        <span class="text-xs text-slate-500">Showing {{ shownLabel }}</span>
      </div>

      <div v-if="activeRows.length" class="mt-3 divide-y divide-slate-100 border-y border-slate-200">
        <button
          v-for="row in visibleRows"
          :key="row.key"
          type="button"
          class="grid w-full gap-1 px-2 py-2.5 text-left text-xs transition hover:bg-blue-50 sm:grid-cols-[1fr_auto]"
          @click="emit('inspect-link', row.link)"
        >
          <span class="min-w-0">
            <span class="block truncate font-semibold text-slate-800">
              {{ row.link.sourceNode.label }} -> {{ row.link.targetNode.label }}
            </span>
            <span class="mt-0.5 block text-slate-500">{{ row.link.edgeType }}</span>
          </span>
          <span class="tabular-nums text-slate-600">
            {{ row.detail }}
          </span>
        </button>
      </div>

      <button
        v-if="activeRows.length > previewLimit"
        type="button"
        class="va-button mt-3 w-full"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show fewer records' : `Show all ${activeRows.length.toLocaleString()} records` }}
      </button>

      <p v-else class="mt-3 rounded bg-slate-50 px-3 py-4 text-sm text-slate-500">
        No records in this category under the current filters.
      </p>
    </div>

    <p class="mt-3 text-xs leading-5 text-slate-500">
      Chronology checks compare endpoint years; missing years mark unavailable temporal context; duplicates may be valid in a multigraph.
    </p>
  </article>
</template>