<script setup>
import * as d3 from 'd3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { entityTypeColor } from '../data/visualEncodings'
import { relationshipDash } from '../data/relationshipSemantics'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  nodes: { type: Array, required: true },
  links: { type: Array, required: true },
  totalNodes: { type: Number, default: 0 },
  totalLinks: { type: Number, default: 0 },
  matchingNodes: { type: Number, default: 0 },
  nodeLimit: { type: Number, default: 100 },
  degreeMin: { type: Number, default: 0 },
  degreeMax: { type: Number, default: 0 },
  graphMaxDegree: { type: Number, default: 0 },
  selectedNodeId: { type: String, default: '' },
})

const emit = defineEmits(['select-node', 'select-link', 'update-degree-range'])

const svgRef = ref(null)
const zoomTransform = ref(d3.zoomIdentity)
const navigationEnabled = ref(false)
const draftDegreeMin = ref(0)
const draftDegreeMax = ref(0)
let zoomBehavior = null

const width = 820
const height = 430
const center = { x: width / 2, y: height / 2 }

onMounted(() => {
  zoomBehavior = d3
    .zoom()
    .scaleExtent([0.55, 3.2])
    .extent([
      [0, 0],
      [width, height],
    ])
    .translateExtent([
      [-width * 0.35, -height * 0.35],
      [width * 1.35, height * 1.35],
    ])
    .filter((event) => navigationEnabled.value && !event.button)
    .on('zoom', (event) => {
      zoomTransform.value = event.transform
    })

  d3.select(svgRef.value).call(zoomBehavior).on('dblclick.zoom', null)
})

onBeforeUnmount(() => {
  if (svgRef.value) d3.select(svgRef.value).on('.zoom', null)
})

watch(
  () => [props.degreeMin, props.degreeMax],
  ([min, max]) => {
    draftDegreeMin.value = min
    draftDegreeMax.value = max
  },
  { immediate: true },
)

watch(
  () => [props.nodes, props.links],
  async () => {
    await nextTick()
    resetView()
  },
)

const positionedNodes = computed(() => {
  if (!props.nodes.length) return []

  const nodeCopies = props.nodes.map((node, index) => {
    const angle = (index / props.nodes.length) * Math.PI * 2
    return {
      ...node,
      x: center.x + Math.cos(angle) * 145,
      y: center.y + Math.sin(angle) * 145,
    }
  })
  const linkCopies = props.links.map((link) => ({ ...link }))

  const simulation = d3
    .forceSimulation(nodeCopies)
    .force(
      'link',
      d3
        .forceLink(linkCopies)
        .id((node) => node.id)
        .distance(34)
        .strength(0.42),
    )
    .force('charge', d3.forceManyBody().strength(-55))
    .force('center', d3.forceCenter(center.x, center.y))
    .force('collision', d3.forceCollide().radius((node) => nodeRadius(node) + 5))
    .stop()

  for (let tick = 0; tick < 35; tick += 1) simulation.tick()
  return nodeCopies
})

const nodeById = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])))
const positionedLinks = computed(() =>
  props.links
    .map((link) => ({
      ...link,
      sourceNode: nodeById.value.get(link.source),
      targetNode: nodeById.value.get(link.target),
    }))
    .filter((link) => link.sourceNode && link.targetNode),
)
const maxDegree = computed(() => Math.max(...props.nodes.map((node) => node.degree ?? 0), 1))
const radiusScale = computed(() => d3.scaleSqrt().domain([0, maxDegree.value]).range([5, 20]))
const labeledNodes = computed(() => {
  const hubs = [...positionedNodes.value]
    .sort((a, b) => (b.degree ?? 0) - (a.degree ?? 0))
    .slice(0, 14)
    .map((node) => node.id)
  return new Set(hubs)
})
const limitCaption = computed(() => {
  const matching = props.matchingNodes || props.totalNodes
  if (matching <= props.nodeLimit) {
    return `Showing all ${matching.toLocaleString()} nodes with degree ${props.degreeMin}-${props.degreeMax}`
  }
  return `Showing top ${props.nodes.length.toLocaleString()} of ${matching.toLocaleString()} nodes with degree ${props.degreeMin}-${props.degreeMax}`
})

function nodeRadius(node) {
  return radiusScale.value(node.degree ?? 0)
}

function linkStroke() {
  return '#cbd5e1'
}

function previewDegreeMin(value) {
  draftDegreeMin.value = Math.min(Number(value), draftDegreeMax.value)
}

function previewDegreeMax(value) {
  draftDegreeMax.value = Math.max(Number(value), draftDegreeMin.value)
}

function applyDegreeRange() {
  emit('update-degree-range', {
    min: draftDegreeMin.value,
    max: draftDegreeMax.value,
  })
}

function zoomBy(factor) {
  if (!navigationEnabled.value || !svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(180).call(zoomBehavior.scaleBy, factor)
}

function resetView() {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value)
    .transition()
    .duration(220)
    .call(zoomBehavior.transform, d3.zoomIdentity)
}

function toggleNavigation() {
  navigationEnabled.value = !navigationEnabled.value
}
</script>

<template>
  <article class="va-card va-card-pad flex h-full min-h-[760px] flex-col">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-1.5">
          <h2 class="va-panel-title">Node-link Diagram</h2>
          <InfoTooltip
            text="This panel shows the subgraph induced by the current Edge Overview and global filters. The degree window controls hairball reduction."
          />
        </div>
        <p class="va-panel-copy mt-1">
          Inspect the filtered subgraph and choose an ego node for local analysis.
        </p>
      </div>
      <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
        <p class="font-semibold text-slate-800">{{ limitCaption }}</p>
        <p class="mt-0.5">{{ links.length.toLocaleString() }} visible links in this drawing</p>
      </div>
    </div>

    <div class="mt-3 grid gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:grid-cols-2">
      <label class="grid gap-1">
        <span class="font-semibold text-slate-700">Minimum degree: {{ draftDegreeMin }}</span>
        <input
          class="w-full accent-blue-700"
          type="range"
          min="0"
          :max="graphMaxDegree"
          :value="draftDegreeMin"
          @input="previewDegreeMin($event.target.value)"
          @change="applyDegreeRange"
        />
      </label>
      <label class="grid gap-1">
        <span class="font-semibold text-slate-700">Maximum degree: {{ draftDegreeMax }}</span>
        <input
          class="w-full accent-blue-700"
          type="range"
          min="0"
          :max="graphMaxDegree"
          :value="draftDegreeMax"
          @input="previewDegreeMax($event.target.value)"
          @change="applyDegreeRange"
        />
      </label>
      <p class="text-xs leading-5 text-slate-500 sm:col-span-2">
        Dragging previews the degree window; the graph updates when the slider is released.
      </p>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-end gap-1">
      <button type="button" class="va-button" @click="toggleNavigation">
        {{ navigationEnabled ? 'Disable navigation' : 'Enable navigation' }}
      </button>
      <button type="button" class="va-button" :disabled="!navigationEnabled" @click="zoomBy(1.18)">+</button>
      <button type="button" class="va-button" :disabled="!navigationEnabled" @click="zoomBy(0.85)">-</button>
      <button type="button" class="va-button" @click="resetView">Reset view</button>
    </div>

    <svg
      ref="svgRef"
      class="mt-2 block min-h-[520px] flex-1 rounded border border-slate-200 bg-slate-50"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="Node-link diagram of the filtered graph"
    >
      <defs>
        <marker
          id="node-link-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
      </defs>

      <g :transform="zoomTransform.toString()">
        <line
          v-for="link in positionedLinks"
          :key="link.id"
          :x1="link.sourceNode.x"
          :y1="link.sourceNode.y"
          :x2="link.targetNode.x"
          :y2="link.targetNode.y"
          :stroke="linkStroke(link)"
          stroke-width="1"
          :stroke-dasharray="relationshipDash(link)"
          marker-end="url(#node-link-arrow)"
          opacity="0.72"
          @click.stop="emit('select-link', link)"
        >
          <title>{{ link.sourceNode.label }} -> {{ link.targetNode.label }}: {{ link.edgeType }}</title>
        </line>

        <g
          v-for="node in positionedNodes"
          :key="node.id"
          class="cursor-pointer"
          @click="emit('select-node', node)"
        >
          <circle
            :cx="node.x"
            :cy="node.y"
            :r="nodeRadius(node)"
            :fill="entityTypeColor(node.nodeType)"
            :stroke="node.id === selectedNodeId ? '#2563eb' : '#ffffff'"
            :stroke-width="node.id === selectedNodeId ? 3 : 1.5"
            opacity="0.92"
          >
            <title>{{ node.label }} - {{ node.nodeType }} - degree {{ node.degree }}</title>
          </circle>
          <text
            v-if="labeledNodes.has(node.id) || node.id === selectedNodeId"
            :x="node.x + nodeRadius(node) + 4"
            :y="node.y + 4"
            class="fill-slate-700 text-xs"
          >
            {{ node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label }}
          </text>
        </g>
      </g>
    </svg>

    <p class="mt-3 text-xs leading-5 text-slate-500">
      Navigation is off by default to avoid accidental touchpad zooming. The degree window and
      top-node limit are explicit because the full filtered graph can become a hairball. Click a
      node to update the ego network extracted from the original graph.
    </p>
  </article>
</template>



