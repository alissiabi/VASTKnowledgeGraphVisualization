<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  focusProfile: {
    type: Object,
    default: null,
  },
  comparisonProfile: {
    type: Object,
    default: null,
  },
  candidates: {
    type: Array,
    default: () => [],
  },
  artists: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select-comparison', 'select-focus'])

const query = ref('')
const isOpen = ref(false)

watch(
  () => props.comparisonProfile,
  (profile) => {
    query.value = profile?.node.label ?? ''
  },
  { immediate: true },
)

const searchResults = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle.length < 2) return []
  return props.artists
    .filter((artist) => artist.id !== props.focusProfile?.node.id)
    .filter((artist) => artist.label.toLowerCase().includes(needle))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 8)
})

const measures = computed(() => [
  { label: 'Connected works', key: 'workCount' },
  { label: 'Oceanus Folk works', key: 'oceanusWorkCount' },
  { label: 'Known genres', key: 'genreCount' },
  { label: 'Creative-role links', key: 'creativeRoleLinks' },
  { label: 'Performance links', key: 'performanceLinks' },
  { label: 'Influence links', key: 'influenceLinks' },
  { label: 'Active release years', key: 'activeYearCount' },
])

function chooseArtist(artist) {
  query.value = artist.label
  isOpen.value = false
  emit('select-comparison', artist)
}

function barWidth(profile, key) {
  const maximum = Math.max(
    props.focusProfile?.[key] ?? 0,
    props.comparisonProfile?.[key] ?? 0,
    1,
  )
  return `${((profile?.[key] ?? 0) / maximum) * 100}%`
}
</script>

<template>
  <section class="va-card va-card-pad">
    <div class="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <div>
        <h2 class="va-panel-title">Artist comparison</h2>
        <p class="va-panel-copy mt-1">
          Compare the current artist with a connected candidate using counts derived from the
          visible graph.
        </p>

        <div class="relative mt-4">
          <label for="comparison-search" class="text-xs font-semibold text-slate-600">
            Compare with
          </label>
          <input
            id="comparison-search"
            v-model="query"
            type="search"
            class="va-control mt-1"
            placeholder="Search an artist"
            autocomplete="off"
            @focus="isOpen = true"
            @input="isOpen = true"
            @keydown.escape="isOpen = false"
          />
          <div
            v-if="isOpen && query.trim().length >= 2"
            class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border border-slate-300 bg-white shadow-lg"
          >
            <button
              v-for="artist in searchResults"
              :key="artist.id"
              type="button"
              class="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-blue-50"
              @mousedown.prevent="chooseArtist(artist)"
            >
              {{ artist.label }}
            </button>
            <p v-if="!searchResults.length" class="px-3 py-3 text-sm text-slate-500">
              No matching artist.
            </p>
          </div>
        </div>

        <div v-if="candidates.length" class="mt-4">
          <p class="text-xs font-semibold text-slate-600">Connected suggestions</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="candidate in candidates"
              :key="candidate.node.id"
              type="button"
              class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-blue-400 hover:bg-blue-50"
              @click="chooseArtist(candidate.node)"
            >
              {{ candidate.node.label }}
              <span class="text-slate-500">({{ candidate.sharedWorks }} shared)</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="focusProfile && comparisonProfile" class="min-w-0 overflow-x-auto">
        <div class="min-w-[560px]">
          <div class="grid grid-cols-[minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-3 border-b border-slate-200 pb-2 text-xs">
            <span class="font-semibold text-slate-600">Measure</span>
            <button
              type="button"
              class="truncate text-left font-semibold text-blue-800 hover:underline"
              @click="emit('select-focus', focusProfile.node)"
            >
              {{ focusProfile.node.label }}
            </button>
            <button
              type="button"
              class="truncate text-left font-semibold text-indigo-800 hover:underline"
              @click="emit('select-focus', comparisonProfile.node)"
            >
              {{ comparisonProfile.node.label }}
            </button>
          </div>

          <div
            v-for="measure in measures"
            :key="measure.key"
            class="grid grid-cols-[minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center gap-3 border-b border-slate-100 py-2.5 text-sm"
          >
            <span class="text-xs font-medium text-slate-600">{{ measure.label }}</span>
            <div>
              <span class="tabular-nums font-semibold text-slate-900">
                {{ focusProfile[measure.key].toLocaleString() }}
              </span>
              <span class="mt-1 block h-1.5 bg-slate-100">
                <span class="block h-full bg-blue-600" :style="{ width: barWidth(focusProfile, measure.key) }" />
              </span>
            </div>
            <div>
              <span class="tabular-nums font-semibold text-slate-900">
                {{ comparisonProfile[measure.key].toLocaleString() }}
              </span>
              <span class="mt-1 block h-1.5 bg-slate-100">
                <span class="block h-full bg-indigo-600" :style="{ width: barWidth(comparisonProfile, measure.key) }" />
              </span>
            </div>
          </div>

          <p class="mt-3 text-xs leading-5 text-slate-500">
            Bars are normalized independently for each measure. Counts describe association and
            activity in the visible graph; they are not a quality or success score.
          </p>
        </div>
      </div>

      <div v-else class="flex min-h-40 items-center justify-center border-l border-slate-200 px-4 text-sm text-slate-500">
        Select a second artist to begin the comparison.
      </div>
    </div>
  </section>
</template>
