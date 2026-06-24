<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  sourceNode: {
    type: Object,
    default: null,
  },
  targetNode: {
    type: Object,
    default: null,
  },
  path: {
    type: Object,
    default: null,
  },
  fullGraphPath: {
    type: Object,
    default: null,
  },
  filtersActive: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-target', 'select-node', 'select-link', 'clear', 'toggle-mode'])

const query = ref('')
const isOpen = ref(false)

watch(
  () => props.targetNode,
  (node) => {
    query.value = node?.label ?? ''
  },
  { immediate: true },
)

const results = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle.length < 2) return []

  return props.nodes
    .filter((node) => node.id !== props.sourceNode?.id)
    .filter((node) => node.label.toLowerCase().includes(needle))
    .sort((a, b) => {
      const aExact = a.label.toLowerCase() === needle
      const bExact = b.label.toLowerCase() === needle
      if (aExact !== bExact) return aExact ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .slice(0, 8)
})

function chooseTarget(node) {
  query.value = node.label
  isOpen.value = false
  emit('select-target', node)
}

function clearTarget() {
  query.value = ''
  isOpen.value = false
  emit('clear')
}

function traversedDirection(link, fromNode, toNode) {
  return link.source === fromNode.id && link.target === toNode.id
    ? `${link.edgeType} \u2192`
    : `\u2190 ${link.edgeType}`
}
</script>

<template>
  <section class="va-card va-card-pad flex h-full min-h-[260px] flex-col">
    <div class="grid flex-1 gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="va-panel-title">Connection path</h2>
          <span
            v-if="active"
            class="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900"
          >
            Selection mode active
          </span>
        </div>
        <p class="va-panel-copy mt-1">
          Discover how the current focus connects to another entity through observed MC1 links.
        </p>
        <p v-if="active" class="mt-3 text-sm font-medium leading-5 text-amber-900">
          Click a node in the ego network to use it as the destination.
        </p>
        <p class="mt-2 text-xs leading-5 text-slate-500">
          The path is derived with an undirected breadth-first search limited to six hops. Link
          arrows retain the direction stored in the source data.
        </p>
        <button
          type="button"
          class="va-button mt-3"
          :class="active ? 'border-amber-400 bg-amber-50 text-amber-950' : ''"
          @click="emit('toggle-mode')"
        >
          {{ active ? 'Exit path mode' : 'Find connection' }}
        </button>
      </div>

      <div>
        <div class="grid gap-3 sm:grid-cols-[0.8fr_1.2fr_auto] sm:items-end">
          <div>
            <span class="text-xs font-semibold text-slate-600">From</span>
            <p class="mt-1 truncate rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {{ sourceNode?.label ?? 'No selected entity' }}
            </p>
          </div>

          <div class="relative">
            <label for="path-target" class="text-xs font-semibold text-slate-600">To</label>
            <input
              id="path-target"
              v-model="query"
              type="search"
              class="va-control mt-1"
              placeholder="Search destination"
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
                v-for="node in results"
                :key="node.id"
                type="button"
                class="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-blue-50"
                @mousedown.prevent="chooseTarget(node)"
              >
                <span class="truncate font-medium text-slate-900">{{ node.label }}</span>
                <span class="shrink-0 text-xs text-slate-500">{{ node.nodeType }}</span>
              </button>
              <p v-if="!results.length" class="px-3 py-3 text-sm text-slate-500">
                No matching entity.
              </p>
            </div>
          </div>

          <button type="button" class="va-button" :disabled="!targetNode" @click="clearTarget">
            Clear
          </button>
        </div>

        <div v-if="path" class="mt-4 rounded border border-blue-200 bg-blue-50/40 p-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-semibold text-blue-900">
              Shortest visible path: {{ path.hopCount }} {{ path.hopCount === 1 ? 'hop' : 'hops' }}
            </p>
            <span class="text-xs text-blue-800">Derived result</span>
          </div>

          <ol class="mt-3 space-y-2">
            <li v-for="(node, index) in path.nodes" :key="node.id">
              <button
                type="button"
                class="text-left text-sm font-semibold text-slate-900 hover:text-blue-700"
                @click="emit('select-node', node)"
              >
                {{ node.label }}
                <span class="ml-1 text-xs font-normal text-slate-500">{{ node.nodeType }}</span>
              </button>
              <button
                v-if="path.links[index]"
                type="button"
                class="ml-3 mt-1 block border-l-2 border-slate-300 pl-3 text-left text-xs text-slate-600 hover:text-blue-700"
                @click="emit('select-link', path.links[index])"
              >
                {{ traversedDirection(path.links[index], node, path.nodes[index + 1]) }}
                <span class="ml-1 text-slate-400">Observed link record</span>
              </button>
            </li>
          </ol>
        </div>

        <div
          v-else-if="targetNode"
          class="mt-4 flex-1 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
        >
          <p class="font-semibold">No path found in the current filtered graph.</p>
          <p v-if="filtersActive && fullGraphPath" class="mt-1 text-amber-800">
            A {{ fullGraphPath.hopCount }}-hop path exists in the complete graph, so active filters
            are hiding at least one required node or relationship.
          </p>
          <p v-else class="mt-1 text-amber-800">
            No connection was found within the six-hop search limit.
          </p>
        </div>

        <div v-else class="mt-4 flex-1 rounded border border-dashed border-slate-300 bg-slate-50 p-4">
          <p class="text-sm font-semibold text-slate-800">No destination selected</p>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search for an entity or enable path mode and click a node in the network. The resulting
            path will appear here with every traversed relationship available for inspection.
          </p>
          <dl class="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
            <div class="rounded border border-slate-200 bg-white px-3 py-2">
              <dt class="font-semibold text-slate-700">Search depth</dt>
              <dd class="mt-1">Up to 6 hops</dd>
            </div>
            <div class="rounded border border-slate-200 bg-white px-3 py-2">
              <dt class="font-semibold text-slate-700">Traversal</dt>
              <dd class="mt-1">Undirected discovery</dd>
            </div>
            <div class="rounded border border-slate-200 bg-white px-3 py-2">
              <dt class="font-semibold text-slate-700">Evidence</dt>
              <dd class="mt-1">Directed MC1 links</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </section>
</template>
