<script setup>
import { computed, ref } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
  focusId: {
    type: String,
    default: '',
  },
})

const expanded = ref(false)
const visibleLimit = 5
const focusedComponent = computed(() => {
  if (!props.focusId) return null
  return props.summary.components.find((component) => component.nodeIds.includes(props.focusId)) ?? null
})

const visibleComponents = computed(() =>
  expanded.value ? props.summary.components : props.summary.components.slice(0, visibleLimit),
)

function componentShare(component) {
  const largest = props.summary.largest?.nodeCount ?? 1
  return `${(component.nodeCount / largest) * 100}%`
}
</script>

<template>
  <article class="va-card va-card-pad">
    <div class="flex items-center gap-1.5">
      <h2 class="va-panel-title">Connected Components</h2>
      <InfoTooltip
        text="Components are computed on undirected connectivity: edge direction is ignored only for this structural overview."
      />
    </div>
    <p class="va-panel-copy mt-1">
      Summarize whether filters split the visible graph into disconnected regions.
    </p>

    <dl class="mt-4 grid grid-cols-3 gap-3 border-y border-slate-200 py-3 text-sm">
      <div>
        <dt class="text-xs font-semibold text-slate-500">Components</dt>
        <dd class="mt-1 font-semibold tabular-nums text-slate-950">
          {{ summary.total.toLocaleString() }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-semibold text-slate-500">Largest</dt>
        <dd class="mt-1 font-semibold tabular-nums text-slate-950">
          {{ (summary.largest?.nodeCount ?? 0).toLocaleString() }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-semibold text-slate-500">Isolated</dt>
        <dd class="mt-1 font-semibold tabular-nums text-slate-950">
          {{ summary.isolatedCount.toLocaleString() }}
        </dd>
      </div>
    </dl>

    <p v-if="focusedComponent" class="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-950">
      Current focus is in a component with
      <strong class="font-semibold">{{ focusedComponent.nodeCount.toLocaleString() }}</strong>
      entities and
      <strong class="font-semibold">{{ focusedComponent.linkCount.toLocaleString() }}</strong>
      relationships.
    </p>

    <div class="mt-3 space-y-1.5">
      <div
        v-for="component in visibleComponents"
        :key="component.id"
        class="rounded border border-slate-200 px-3 py-1.5"
        :class="focusedComponent?.id === component.id ? 'bg-blue-50 ring-1 ring-blue-300' : 'bg-white'"
      >
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="font-semibold text-slate-700">
            Component {{ component.id }}
            <span class="font-normal text-slate-500">({{ component.dominantType }})</span>
          </span>
          <span class="tabular-nums text-slate-600">
            {{ component.nodeCount.toLocaleString() }} nodes / {{ component.linkCount.toLocaleString() }} links
          </span>
        </div>
        <div class="mt-2 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
          <div class="h-1.5 rounded-full bg-slate-700" :style="{ width: componentShare(component) }"></div>
        </div>
      </div>
    </div>

    <button
      v-if="summary.components.length > visibleLimit"
      type="button"
      class="va-button mt-3 w-full"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show top 5 components' : `Show all components (${summary.components.length})` }}
    </button>

    <p class="mt-2 text-xs leading-5 text-slate-500">
      This is not community detection; it only reports connected regions in the current subset.
    </p>
  </article>
</template>