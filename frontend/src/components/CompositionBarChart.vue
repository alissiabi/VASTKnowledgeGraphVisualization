<script setup>
import { computed } from 'vue'
import { ENTITY_TYPE_ORDER, entityTypeColor } from '../data/visualEncodings'

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
  referenceRows: {
    type: Array,
    required: true,
  },
  selected: {
    type: String,
    default: '',
  },
  limit: {
    type: Number,
    default: 6,
  },
})

const emit = defineEmits(['select'])

const visibleByType = computed(() => new Map(props.rows.map((row) => [row.label, row.value])))
const referenceRows = computed(() =>
  [...props.referenceRows]
    .sort(
      (a, b) =>
        ENTITY_TYPE_ORDER.indexOf(a.label) - ENTITY_TYPE_ORDER.indexOf(b.label),
    )
    .slice(0, props.limit),
)
const total = computed(() => referenceRows.value.reduce((sum, row) => sum + row.value, 0))
const segments = computed(() =>
  referenceRows.value.map((row) => ({
    ...row,
    visibleValue: visibleByType.value.get(row.label) ?? 0,
    color: entityTypeColor(row.label),
    share: total.value ? (row.value / total.value) * 100 : 0,
  })),
)

function selectRow(label) {
  emit('select', props.selected === label ? '' : label)
}
</script>

<template>
  <article class="va-card va-card-pad h-full">
    <div>
      <h2 class="va-panel-title">{{ title }}</h2>
      <p v-if="subtitle" class="va-panel-copy mt-1">{{ subtitle }}</p>
    </div>

    <div v-if="segments.length" class="mt-4">
      <div
        class="flex h-5 w-full overflow-hidden rounded bg-slate-100"
        role="img"
        :aria-label="`${title}: ${total.toLocaleString()} total`"
      >
        <button
          v-for="segment in segments"
          :key="segment.label"
          type="button"
          class="h-full transition-opacity"
          :class="selected && selected !== segment.label ? 'opacity-25' : 'opacity-100'"
          :style="{ width: `${segment.share}%`, backgroundColor: segment.color }"
          :aria-label="`${segment.label}: ${segment.visibleValue.toLocaleString()} visible of ${segment.value.toLocaleString()} total`"
          @click="selectRow(segment.label)"
        />
      </div>

      <div class="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <button
          v-for="segment in segments"
          :key="`legend-${segment.label}`"
          type="button"
          class="flex items-center gap-2 rounded px-1 py-1 text-left text-xs transition hover:bg-slate-50"
          :class="selected === segment.label ? 'bg-blue-50 text-blue-950' : 'text-slate-600'"
          @click="selectRow(segment.label)"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-sm"
            :style="{ backgroundColor: segment.color }"
          />
          <span class="min-w-0 flex-1 truncate">{{ segment.label }}</span>
          <span class="shrink-0 text-right tabular-nums">
            <strong class="font-semibold text-slate-800">
              {{ segment.visibleValue.toLocaleString() }}
            </strong>
            / {{ segment.value.toLocaleString() }}
          </span>
        </button>
      </div>

      <p class="mt-3 text-xs text-slate-500">
        Values show visible entities / complete dataset. Segment widths retain the complete
        dataset composition during filtering.
      </p>
    </div>

    <p v-else class="mt-4 text-sm text-slate-500">No entity composition is available.</p>
  </article>
</template>
