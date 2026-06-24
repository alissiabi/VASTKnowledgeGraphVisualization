<script setup>
import { computed } from 'vue'

const props = defineProps({
  link: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['filter-type', 'select-node', 'clear'])

const sourceYear = computed(() => props.link?.sourceNode?.releaseYear ?? null)
const targetYear = computed(() => props.link?.targetNode?.releaseYear ?? null)
const chronology = computed(() => {
  if (!props.link || !isInfluenceRelationship(props.link)) return 'Not applicable'
  if (!sourceYear.value || !targetYear.value) return 'Unavailable'
  return sourceYear.value >= targetYear.value ? 'Consistent' : 'Possible inconsistency'
})
const relationshipProperties = computed(() =>
  Object.entries(props.link?.rawProperties ?? {}).map(([key, value]) => ({
    key,
    label: formatLabel(key),
    value: formatValue(value),
  })),
)

function isInfluenceRelationship(link) {
  return ['style', 'interpolates', 'reference', 'cover', 'sample'].some((token) =>
    link.edgeTypeKey.includes(token),
  )
}

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-slate-950">Selected relationship</h3>
      <button
        v-if="link"
        type="button"
        class="text-xs font-medium text-slate-500 hover:text-blue-700"
        @click="emit('clear')"
      >
        Clear
      </button>
    </div>

    <div v-if="link" class="va-detail-box mt-3">
      <div class="mb-3 flex justify-end">
        <span class="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
          Observed link record
        </span>
      </div>
      <button
        type="button"
        class="text-left text-sm font-semibold text-blue-800 hover:underline"
        @click="emit('select-node', link.sourceNode)"
      >
        {{ link.sourceNode.label }}
      </button>
      <div class="my-2 flex items-center gap-2 text-xs text-slate-500">
        <span aria-hidden="true">&rarr;</span>
        <span class="rounded bg-white px-2 py-1 font-medium text-slate-700">{{ link.edgeType }}</span>
      </div>
      <button
        type="button"
        class="text-left text-sm font-semibold text-blue-800 hover:underline"
        @click="emit('select-node', link.targetNode)"
      >
        {{ link.targetNode.label }}
      </button>

      <dl class="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
        <div>
          <dt class="text-slate-500">Source record id</dt>
          <dd class="mt-1 break-all font-medium text-slate-800">{{ link.rawSource }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Target record id</dt>
          <dd class="mt-1 break-all font-medium text-slate-800">{{ link.rawTarget }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Direction</dt>
          <dd class="mt-1 font-medium text-slate-800">Source to target</dd>
        </div>
        <div>
          <dt class="text-slate-500">Relationship date</dt>
          <dd class="mt-1 font-medium text-slate-800">Not provided</dd>
        </div>
        <div>
          <dt class="text-slate-500">Source release year</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ sourceYear ?? 'Unknown' }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Target release year</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ targetYear ?? 'Unknown' }}</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-slate-500">Derived influence chronology</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ chronology }}</dd>
        </div>
        <div v-for="row in relationshipProperties" :key="row.key">
          <dt class="text-slate-500">{{ row.label }}</dt>
          <dd class="mt-1 break-words font-medium text-slate-800">{{ row.value }}</dd>
        </div>
      </dl>

      <p class="mt-3 text-xs leading-5 text-slate-500">
        Source, target, direction, type, and raw properties are observed in MC1. Chronology is a
        derived consistency check using endpoint release years. MC1 links contain no date field.
      </p>

      <button type="button" class="va-button mt-3 w-full" @click="emit('filter-type', link.edgeType)">
        Filter by {{ link.edgeType }}
      </button>
    </div>

    <p v-else class="mt-3 text-sm leading-6 text-slate-500">
      Select a network edge or an evidence-table row to inspect its direction and endpoints.
    </p>
  </section>
</template>
