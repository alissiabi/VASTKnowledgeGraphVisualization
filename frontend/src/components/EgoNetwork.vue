<script setup>
import * as d3 from 'd3'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import InfoTooltip from './InfoTooltip.vue'
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_ORDER,
  entityTypeColor,
} from '../data/visualEncodings'
import {
  RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_CATEGORY_ORDER,
  relationshipCategory,
  relationshipDash,
} from '../data/relationshipSemantics'

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  links: {
    type: Array,
    required: true,
  },
  centerId: {
    type: String,
    required: true,
  },
  networkSettings: {
    type: Object,
    required: true,
  },
  selectedLinkId: {
    type: String,
    default: '',
  },
  pathNodeIds: {
    type: Array,
    default: () => [],
  },
  pathLinkIds: {
    type: Array,
    default: () => [],
  },
  pathSelectionMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'select-node',
  'select-path-target',
  'select-link',
  'update-network-settings',
])

const hoveredNodeId = ref('')
const hoveredLinkId = ref('')
const svgRef = ref(null)
const zoomTransform = ref(d3.zoomIdentity)
const navigationEnabled = ref(false)
let zoomBehavior = null

const width = 760
const height = 460
const center = { x: width / 2, y: height / 2 }
const ringRadii = {
  0: 0,
  1: 125,
  2: 195,
}

onMounted(() => {
  zoomBehavior = d3
    .zoom()
    .scaleExtent([0.65, 2.8])
    .extent([
      [0, 0],
      [width, height],
    ])
    .translateExtent([
      [-width * 0.25, -height * 0.25],
      [width * 1.25, height * 1.25],
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
  () => props.centerId,
  async () => {
    await nextTick()
    resetView()
  },
)

const legendTypes = ENTITY_TYPE_ORDER.filter((type) => type !== 'Unknown').map((type) => ({
  type,
  label: type === 'RecordLabel' ? 'Record label' : type === 'MusicalGroup' ? 'Group' : type,
  color: ENTITY_TYPE_COLORS[type],
}))
const relationshipLegend = RELATIONSHIP_CATEGORY_ORDER.filter(
  (category) => category !== 'other',
).map((category) => ({
  category,
  label: RELATIONSHIP_CATEGORIES[category].label,
  dash: RELATIONSHIP_CATEGORIES[category].dash,
}))

const positionedNodes = computed(() => {
  const grouped = d3.group(props.nodes, (node) => node.distance ?? 2)
  const output = []

  for (const [distance, nodes] of grouped) {
    if (Number(distance) === 0) {
      output.push({
        ...nodes[0],
        x: center.x,
        y: center.y,
      })
      continue
    }

    const radius = ringRadii[distance] ?? ringRadii[2]
    const sortedNodes = [...nodes].sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))
    const angleStep = (Math.PI * 2) / sortedNodes.length

    sortedNodes.forEach((node, index) => {
      const angle = -Math.PI / 2 + index * angleStep
      output.push({
        ...node,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      })
    })
  }

  return output
})

const nodeById = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])))

const positionedLinks = computed(() =>
  props.links
    .filter(
      (link) =>
        props.networkSettings.relationshipFocus === 'all' ||
        relationshipCategory(link) === props.networkSettings.relationshipFocus,
    )
    .map((link) => ({
      ...link,
      sourceNode: nodeById.value.get(link.source),
      targetNode: nodeById.value.get(link.target),
    }))
    .filter((link) => link.sourceNode && link.targetNode),
)

const maxDegree = computed(() => Math.max(...positionedNodes.value.map((node) => node.degree ?? 0), 1))
const radiusScale = computed(() => d3.scaleSqrt().domain([0, maxDegree.value]).range([6, 18]))
function nodeColor(node) {
  return entityTypeColor(node.nodeType)
}

function nodeRadius(node) {
  if (node.id === props.centerId) return 22
  return radiusScale.value(node.degree ?? 0)
}

function linkPath(link) {
  const dx = link.targetNode.x - link.sourceNode.x
  const dy = link.targetNode.y - link.sourceNode.y
  const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
  const sourceOffset = nodeRadius(link.sourceNode) + 2
  const targetOffset = nodeRadius(link.targetNode) + 8
  const sx = link.sourceNode.x + (dx / distance) * sourceOffset
  const sy = link.sourceNode.y + (dy / distance) * sourceOffset
  const tx = link.targetNode.x - (dx / distance) * targetOffset
  const ty = link.targetNode.y - (dy / distance) * targetOffset
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.4

  return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
}

function selectNode(node) {
  emit(props.pathSelectionMode ? 'select-path-target' : 'select-node', node)
}

function updateSetting(key, value) {
  emit('update-network-settings', {
    ...props.networkSettings,
    [key]: value,
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

function isLinkHighlighted(link) {
  if (props.pathLinkIds.includes(link.id)) return true
  if (props.selectedLinkId === link.id) return true
  if (hoveredLinkId.value === link.id) return true
  if (!hoveredNodeId.value) return true
  return link.source === hoveredNodeId.value || link.target === hoveredNodeId.value
}

function isNodeHighlighted(node) {
  if (props.pathNodeIds.includes(node.id)) return true
  if (!hoveredNodeId.value && !hoveredLinkId.value) return true
  if (hoveredNodeId.value === node.id) return true

  const hoveredLink = positionedLinks.value.find((link) => link.id === hoveredLinkId.value)
  if (hoveredLink) return hoveredLink.source === node.id || hoveredLink.target === node.id

  return positionedLinks.value.some(
    (link) =>
      (link.source === hoveredNodeId.value && link.target === node.id) ||
      (link.target === hoveredNodeId.value && link.source === node.id),
  )
}
</script>

<template>
  <div class="va-card h-full overflow-hidden">
    <div
      v-if="pathSelectionMode"
      class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950"
    >
      Path mode: click a node to choose the destination. The current center remains the source.
    </div>
    <div class="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div>
        <InfoTooltip
          placement="bottom"
          text="Also called an ego network: the selected entity is at the center, with its direct or two-step neighbors arranged around it."
        >
          <h2 class="va-panel-title">Focused Relationship Network</h2>
        </InfoTooltip>
        <p class="va-panel-copy mt-1">
          Center, direct neighbors, and selected indirect context from the official MC1 graph.
        </p>
      </div>
      <div class="flex gap-3 text-xs text-slate-500">
        <span>{{ nodes.length.toLocaleString() }} entities</span>
        <span>{{ positionedLinks.length.toLocaleString() }} visible relationships</span>
      </div>
    </div>

    <div class="grid gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-3">
      <label class="space-y-1 text-xs font-semibold text-slate-600">
        Network depth
        <select
          class="va-control font-normal normal-case"
          :value="networkSettings.depth"
          @change="updateSetting('depth', Number($event.target.value))"
        >
          <option :value="1">Direct only</option>
          <option :value="2">Direct plus indirect</option>
        </select>
      </label>

      <label class="space-y-1 text-xs font-semibold text-slate-600">
        Relationship focus
        <select
          class="va-control font-normal normal-case"
          :value="networkSettings.relationshipFocus"
          @change="updateSetting('relationshipFocus', $event.target.value)"
        >
          <option value="all">All relationships</option>
          <option value="creative">Creative roles</option>
          <option value="performance">Performance / recording</option>
          <option value="membership">Group membership</option>
          <option value="distribution">Distribution</option>
          <option value="influence">Influence / reference</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label class="space-y-1 text-xs font-semibold text-slate-600">
        Node limit
        <select
          class="va-control font-normal normal-case"
          :value="networkSettings.nodeLimit"
          @change="updateSetting('nodeLimit', Number($event.target.value))"
        >
          <option :value="25">25 most connected</option>
          <option :value="50">50 most connected</option>
          <option :value="100">100 most connected</option>
        </select>
      </label>
    </div>

    <div class="relative overflow-hidden bg-white">
      <div
        class="absolute right-3 top-3 z-[1] flex items-center gap-1 rounded border border-slate-300 bg-white/95 p-1 shadow-sm"
        aria-label="Network navigation controls"
      >
        <button
          type="button"
          class="va-button px-2 py-1 text-xs"
          :class="navigationEnabled ? 'border-blue-600 bg-blue-50 text-blue-800' : ''"
          :aria-pressed="navigationEnabled"
          @click="toggleNavigation"
        >
          {{ navigationEnabled ? 'Navigation on' : 'Enable navigation' }}
        </button>
        <button
          type="button"
          class="va-icon-button"
          title="Zoom in"
          aria-label="Zoom in"
          :disabled="!navigationEnabled"
          @click="zoomBy(1.25)"
        >
          +
        </button>
        <button
          type="button"
          class="va-icon-button"
          title="Zoom out"
          aria-label="Zoom out"
          :disabled="!navigationEnabled"
          @click="zoomBy(0.8)"
        >
          -
        </button>
        <button
          type="button"
          class="va-button px-2 py-1 text-xs"
          title="Reset zoom and pan"
          @click="resetView"
        >
          Reset view
        </button>
      </div>

      <svg
        ref="svgRef"
        class="block h-auto w-full"
        :class="navigationEnabled ? 'touch-none cursor-grab active:cursor-grabbing' : 'touch-auto'"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        aria-label="Focused relationship network visualization"
      >
        <defs>
          <marker
            id="relationship-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>

        <g :transform="zoomTransform.toString()">
          <circle
            v-for="distance in [1, 2]"
            :key="distance"
            :cx="center.x"
            :cy="center.y"
            :r="ringRadii[distance]"
            fill="none"
            stroke="#e2e8f0"
            stroke-dasharray="4 6"
          />

          <path
            v-for="link in positionedLinks"
            :key="link.id"
            :d="linkPath(link)"
            fill="none"
            class="cursor-pointer"
            :stroke-dasharray="relationshipDash(link)"
            :stroke-opacity="isLinkHighlighted(link) ? 0.72 : 0.12"
            marker-end="url(#relationship-arrow)"
            :stroke="
              pathLinkIds.includes(link.id)
                ? '#b45309'
                : hoveredLinkId === link.id || selectedLinkId === link.id
                  ? '#2563eb'
                  : '#94a3b8'
            "
            :stroke-width="
              pathLinkIds.includes(link.id) ||
              hoveredLinkId === link.id ||
              selectedLinkId === link.id
                ? 2.6
                : 1.2
            "
            @click.stop="emit('select-link', link)"
            @mouseenter="hoveredLinkId = link.id"
            @mouseleave="hoveredLinkId = ''"
          >
            <title>
              {{ link.sourceNode.label }} -> {{ link.targetNode.label }} | {{ link.edgeType }}
              Click to inspect this relationship.
            </title>
          </path>

          <g
            v-for="node in positionedNodes"
            :key="node.id"
            class="cursor-pointer"
            :transform="`translate(${node.x}, ${node.y})`"
            @click.stop="selectNode(node)"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = ''"
          >
            <circle
              :r="nodeRadius(node)"
              :fill="nodeColor(node)"
              :stroke="
                pathNodeIds.includes(node.id) && node.id !== centerId
                  ? '#b45309'
                  : node.id === centerId
                    ? '#2563eb'
                    : '#ffffff'
              "
              :stroke-width="node.id === centerId || pathNodeIds.includes(node.id) ? 4 : 2"
              :opacity="isNodeHighlighted(node) ? 1 : 0.22"
            />
            <text
              v-if="node.id === centerId || hoveredNodeId === node.id"
              :y="nodeRadius(node) + 13"
              text-anchor="middle"
              class="select-none fill-slate-700 text-xs font-medium"
            >
              {{ node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label }}
            </text>
            <title>{{ node.label }} | {{ node.nodeType }} | degree {{ node.degree }}</title>
          </g>
        </g>
      </svg>
      <p
        class="pointer-events-none absolute bottom-2 left-3 rounded bg-white/90 px-2 py-1 text-[11px] text-slate-500"
      >
        {{
          navigationEnabled
            ? 'Navigation on: drag to pan; use the wheel or controls to zoom.'
            : 'Navigation off: enable it before panning or zooming.'
        }}
      </p>
    </div>

    <div class="flex flex-wrap gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
      <span
        v-for="item in legendTypes"
        :key="item.type"
        class="inline-flex items-center gap-1"
      >
        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
        {{ item.label }}
      </span>
      <span
        v-for="item in relationshipLegend"
        :key="item.category"
        class="inline-flex items-center gap-1"
      >
        <svg class="h-3 w-7 overflow-visible" viewBox="0 0 28 12" aria-hidden="true">
          <defs>
            <marker
              :id="`legend-arrow-${item.category}`"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>
          <line
            x1="1"
            y1="6"
            x2="25"
            y2="6"
            stroke="#64748b"
            :stroke-dasharray="item.dash"
            :marker-end="`url(#legend-arrow-${item.category})`"
          />
        </svg>
        {{ item.label }}
      </span>
      <span class="text-slate-500">Arrow shows stored source -> target direction.</span>
    </div>
  </div>
</template>
