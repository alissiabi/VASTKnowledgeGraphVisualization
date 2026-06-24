<script setup>
import { computed, ref, watch } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  links: {
    type: Array,
    required: true,
  },
  selectedLinkId: {
    type: String,
    default: '',
  },
  centerLabel: {
    type: String,
    default: '',
  },
  networkDepth: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['select-link', 'select-node'])

const query = ref('')
const edgeType = ref('')
const timeCoverage = ref('')
const sortKey = ref('relationship')
const sortDirection = ref('asc')
const limit = ref(12)
const columns = [
  { label: 'Source', key: 'source' },
  { label: 'Relationship', key: 'relationship' },
  { label: 'Target', key: 'target' },
  {
    label: 'Source year',
    key: 'sourceYear',
    help: 'Release year of the source entity when it is a dated song or album. This is endpoint context, not the date of the relationship.',
  },
  {
    label: 'Target year',
    key: 'targetYear',
    help: 'Release year of the target entity when it is a dated song or album. This is endpoint context, not the date of the relationship.',
  },
  {
    label: 'Chronology',
    key: 'chronology',
    help: 'For influence-style links only, compares endpoint release years as a consistency check. It does not prove influence.',
  },
]

const edgeTypes = computed(() =>
  Array.from(new Set(props.links.map((link) => link.edgeType))).sort((a, b) => a.localeCompare(b)),
)

const filteredLinks = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return props.links.filter((link) => {
    if (edgeType.value && link.edgeType !== edgeType.value) return false
    const sourceYear = releaseYear(link.sourceNode)
    const targetYear = releaseYear(link.targetNode)
    if (timeCoverage.value === 'both' && (!sourceYear || !targetYear)) return false
    if (timeCoverage.value === 'partial' && Boolean(sourceYear) === Boolean(targetYear)) return false
    if (timeCoverage.value === 'none' && (sourceYear || targetYear)) return false
    if (!needle) return true
    return [link.sourceNode?.label, link.targetNode?.label, link.edgeType]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle))
  })
})

const sortedLinks = computed(() =>
  [...filteredLinks.value].sort((a, b) => {
    const values = {
      source: [a.sourceNode?.label ?? '', b.sourceNode?.label ?? ''],
      relationship: [a.edgeType, b.edgeType],
      target: [a.targetNode?.label ?? '', b.targetNode?.label ?? ''],
      sourceYear: [releaseYear(a.sourceNode) ?? -Infinity, releaseYear(b.sourceNode) ?? -Infinity],
      targetYear: [releaseYear(a.targetNode) ?? -Infinity, releaseYear(b.targetNode) ?? -Infinity],
      chronology: [chronologyStatus(a), chronologyStatus(b)],
    }
    const [left, right] = values[sortKey.value]
    const result =
      typeof left === 'number'
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true })
    return sortDirection.value === 'asc' ? result : -result
  }),
)

const visibleLinks = computed(() => sortedLinks.value.slice(0, limit.value))
const coverageCounts = computed(() =>
  props.links.reduce(
    (counts, link) => {
      const sourceYear = releaseYear(link.sourceNode)
      const targetYear = releaseYear(link.targetNode)
      if (sourceYear && targetYear) counts.both += 1
      else if (sourceYear || targetYear) counts.partial += 1
      else counts.none += 1
      return counts
    },
    { both: 0, partial: 0, none: 0 },
  ),
)

watch([query, edgeType, timeCoverage, sortKey, sortDirection], () => {
  limit.value = 12
})

function releaseYear(node) {
  return node?.releaseYear ?? null
}

function chronologyStatus(link) {
  if (!isInfluenceRelationship(link)) return 'N/A'
  const sourceYear = releaseYear(link.sourceNode)
  const targetYear = releaseYear(link.targetNode)
  if (!sourceYear || !targetYear) return 'Unavailable'
  return sourceYear >= targetYear ? 'Consistent' : 'Check order'
}

function isInfluenceRelationship(link) {
  return ['style', 'interpolates', 'reference', 'cover', 'sample'].some((token) =>
    link.edgeTypeKey.includes(token),
  )
}

function resetEvidenceFilters() {
  query.value = ''
  edgeType.value = ''
  timeCoverage.value = ''
  sortKey.value = 'relationship'
  sortDirection.value = 'asc'
  limit.value = 12
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

function sortLabel(label, key) {
  if (sortKey.value !== key) return label
  return `${label} ${sortDirection.value === 'asc' ? 'ascending' : 'descending'}`
}
</script>

<template>
  <section class="va-card overflow-hidden">
    <div class="border-b border-slate-200 px-4 py-3">
      <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 class="va-panel-title">Observed Relationship Records</h2>
          <p class="va-panel-copy mt-1">
            Observed links in the visible {{ networkDepth }}-hop network centered on
            {{ centerLabel || 'the selected entity' }}.
          </p>
        </div>
        <p class="text-xs tabular-nums text-slate-500">
          {{ filteredLinks.length.toLocaleString() }} of
          {{ links.length.toLocaleString() }} relationships
        </p>
      </div>

      <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.75fr_0.75fr_auto]">
        <label class="text-xs font-semibold text-slate-600">
          Search records
          <input
            v-model="query"
            type="search"
            class="va-control mt-1 font-normal"
            placeholder="Entity or relationship"
          />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Relationship type
          <select v-model="edgeType" class="va-control mt-1 font-normal">
            <option value="">All visible types</option>
            <option v-for="type in edgeTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Endpoint-year coverage
          <select v-model="timeCoverage" class="va-control mt-1 font-normal">
            <option value="">All coverage</option>
            <option value="both">Both dated ({{ coverageCounts.both }})</option>
            <option value="partial">One dated ({{ coverageCounts.partial }})</option>
            <option value="none">Neither dated ({{ coverageCounts.none }})</option>
          </select>
        </label>
        <button type="button" class="va-button self-end" @click="resetEvidenceFilters">Reset</button>
      </div>

      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><strong class="font-semibold text-slate-700">Observed:</strong> source, relationship, target</span>
        <span><strong class="font-semibold text-slate-700">Derived:</strong> endpoint-year context and chronology check</span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th v-for="column in columns" :key="column.key" class="px-4 py-2 font-semibold">
              <span class="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 hover:text-blue-800"
                  :aria-label="sortLabel(column.label, column.key)"
                  @click="sortBy(column.key)"
                >
                  {{ column.label }}
                  <span v-if="sortKey === column.key" aria-hidden="true">
                    {{ sortDirection === 'asc' ? '\u2191' : '\u2193' }}
                  </span>
                </button>
                <InfoTooltip
                  v-if="column.help"
                  placement="bottom"
                  :text="column.help"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="link in visibleLinks"
            :key="link.id"
            class="cursor-pointer border-t border-slate-200 hover:bg-blue-50"
            :class="{ 'bg-blue-50': link.id === selectedLinkId }"
            :aria-selected="link.id === selectedLinkId"
            tabindex="0"
            @click="emit('select-link', link)"
            @keydown.enter="emit('select-link', link)"
            @keydown.space.prevent="emit('select-link', link)"
          >
            <td class="px-4 py-2.5">
              <button
                type="button"
                class="font-medium text-slate-900 hover:text-blue-700"
                @click.stop="emit('select-node', link.sourceNode)"
              >
                {{ link.sourceNode.label }}
              </button>
              <span class="ml-2 text-xs text-slate-500">{{ link.sourceNode.nodeType }}</span>
            </td>
            <td class="px-4 py-2.5 text-slate-700">{{ link.edgeType }} &rarr;</td>
            <td class="px-4 py-2.5">
              <button
                type="button"
                class="font-medium text-slate-900 hover:text-blue-700"
                @click.stop="emit('select-node', link.targetNode)"
              >
                {{ link.targetNode.label }}
              </button>
              <span class="ml-2 text-xs text-slate-500">{{ link.targetNode.nodeType }}</span>
            </td>
            <td class="px-4 py-2.5 tabular-nums text-slate-600">
              {{ releaseYear(link.sourceNode) ?? 'Unknown' }}
            </td>
            <td class="px-4 py-2.5 tabular-nums text-slate-600">
              {{ releaseYear(link.targetNode) ?? 'Unknown' }}
            </td>
            <td class="px-4 py-2.5">
              <span
                class="inline-flex rounded border px-2 py-0.5 text-xs font-medium"
                :class="{
                  'border-blue-200 bg-blue-50 text-blue-800': chronologyStatus(link) === 'Consistent',
                  'border-amber-200 bg-amber-50 text-amber-900': chronologyStatus(link) === 'Check order',
                  'border-slate-200 bg-slate-50 text-slate-600': ['N/A', 'Unavailable'].includes(chronologyStatus(link)),
                }"
              >
                {{ chronologyStatus(link) }}
              </span>
            </td>
          </tr>
          <tr v-if="!visibleLinks.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">
              No relationships match the evidence filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="filteredLinks.length > visibleLinks.length"
      class="border-t border-slate-200 px-4 py-3 text-center"
    >
      <button type="button" class="va-button" @click="limit += 12">Show 12 more</button>
    </div>
  </section>
</template>
