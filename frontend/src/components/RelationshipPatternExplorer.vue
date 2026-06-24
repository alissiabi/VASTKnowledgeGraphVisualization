<script setup>
import * as d3 from 'd3'
import { computed } from 'vue'
import { entityTypeColor } from '../data/visualEncodings.js'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  patterns: { type: Array, required: true },
  sourceOptions: { type: Array, default: () => [] },
  edgeOptions: { type: Array, default: () => [] },
  targetOptions: { type: Array, default: () => [] },
  sourceToEdge: { type: Array, default: () => [] },
  edgeToTarget: { type: Array, default: () => [] },
  totalRelationships: { type: Number, default: 0 },
  selectedSourceType: { type: String, default: '' },
  selectedEdgeType: { type: String, default: '' },
  selectedTargetType: { type: String, default: '' },
  limit: { type: Number, default: 5 },
})

const emit = defineEmits(['select'])

const width = 540
const height = 165
const margin = { top: 8, right: 14, bottom: 8, left: 14 }
const columnWidth = 14
const gap = 5
const sourceX = margin.left
const edgeX = width / 2 - columnWidth / 2
const targetX = width - margin.right - columnWidth
const drawingHeight = height - margin.top - margin.bottom

const hasActivePattern = computed(
  () => props.selectedSourceType || props.selectedEdgeType || props.selectedTargetType,
)
const sourceOptions = computed(() =>
  props.sourceOptions.length
    ? props.sourceOptions
    : rollup(props.patterns, (pattern) => pattern.sourceType),
)
const edgeOptions = computed(() =>
  props.edgeOptions.length
    ? props.edgeOptions
    : rollup(props.patterns, (pattern) => pattern.edgeType),
)
const targetOptions = computed(() =>
  props.targetOptions.length
    ? props.targetOptions
    : rollup(props.patterns, (pattern) => pattern.targetType),
)
const topFlows = computed(() => props.patterns.slice(0, props.limit))
const sankeyData = computed(() => {
  const sources = layoutColumn(sourceOptions.value.slice(0, props.limit), sourceX, 'sourceType')
  const edges = layoutColumn(edgeOptions.value.slice(0, props.limit), edgeX, 'edgeType')
  const targets = layoutColumn(targetOptions.value.slice(0, props.limit), targetX, 'targetType')

  return {
    sources,
    edges,
    targets,
    sourceToEdge: buildLinks(props.sourceToEdge, props.patterns, sources, edges, 'sourceType', 'edgeType'),
    edgeToTarget: buildLinks(props.edgeToTarget, props.patterns, edges, targets, 'edgeType', 'targetType'),
  }
})

function displayType(type) {
  return type?.replace(/([a-z])([A-Z])/g, '$1 $2') ?? 'Unknown'
}

function rollup(rows, accessor) {
  return Array.from(
    d3.rollup(
      rows,
      (items) => d3.sum(items, (item) => item.value),
      accessor,
    ),
    ([key, value]) => ({ key, value }),
  ).sort((a, b) => b.value - a.value || String(a.key).localeCompare(String(b.key)))
}

function layoutColumn(rows, x, field) {
  const total = d3.sum(rows, (row) => row.value) || 1
  const availableHeight = drawingHeight - Math.max(rows.length - 1, 0) * gap
  let cursor = margin.top

  return rows.map((row) => {
    const heightValue = Math.max((row.value / total) * availableHeight, 7)
    const node = {
      ...row,
      field,
      x,
      y: cursor,
      height: heightValue,
      centerY: cursor + heightValue / 2,
    }
    cursor += heightValue + gap
    return node
  })
}

function buildLinks(precomputedLinks, patterns, fromNodes, toNodes, fromField, toField) {
  const fromByKey = new Map(fromNodes.map((node) => [node.key, node]))
  const toByKey = new Map(toNodes.map((node) => [node.key, node]))
  const links = []

  if (precomputedLinks.length) {
    for (const row of precomputedLinks) {
      const from = fromByKey.get(row.from)
      const to = toByKey.get(row.to)
      if (from && to) links.push({ from, to, value: row.value })
    }
  } else {
    const grouped = d3.rollups(
      patterns,
      (items) => d3.sum(items, (item) => item.value),
      (pattern) => pattern[fromField],
      (pattern) => pattern[toField],
    )

    for (const [fromKey, targets] of grouped) {
      const from = fromByKey.get(fromKey)
      if (!from) continue
      for (const [toKey, value] of targets) {
        const to = toByKey.get(toKey)
        if (to) links.push({ from, to, value })
      }
    }
  }

  const maxValue = d3.max(links, (link) => link.value) || 1
  return links
    .sort((a, b) => b.value - a.value)
    .slice(0, props.limit * 2)
    .map((link) => ({ ...link, width: Math.max((link.value / maxValue) * 18, 1.5) }))
}

function linkPath(link) {
  const x1 = link.from.x + columnWidth
  const x2 = link.to.x
  const mid = (x1 + x2) / 2
  return `M${x1},${link.from.centerY} C${mid},${link.from.centerY} ${mid},${link.to.centerY} ${x2},${link.to.centerY}`
}

function nodeColor(node) {
  if (node.field === 'edgeType') return '#64748b'
  return entityTypeColor(node.key)
}

function updateFilter(field, value) {
  emit('select', {
    sourceType: field === 'sourceType' ? value : props.selectedSourceType,
    edgeType: field === 'edgeType' ? value : props.selectedEdgeType,
    targetType: field === 'targetType' ? value : props.selectedTargetType,
  })
}

function selectFlow(flow) {
  emit('select', flow)
}
</script>

<template>
  <article class="va-card va-card-pad overflow-hidden">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-1.5">
          <h2 class="va-panel-title">Edge Overview</h2>
          <InfoTooltip
            text="Overview of MC1 link volume. Use the controls to filter by source type, relationship type, and target type."
          />
        </div>
        <p class="va-panel-copy mt-1">Volume of flows between node types.</p>
      </div>
      <button
        v-if="hasActivePattern"
        type="button"
        class="va-button shrink-0"
        @click="emit('select', null)"
      >
        Clear
      </button>
    </div>

    <div class="mt-3 grid gap-2 text-xs sm:grid-cols-3">
      <label class="grid gap-1">
        <span class="font-semibold text-slate-600">Source</span>
        <select
          class="va-control w-full"
          :value="selectedSourceType"
          @change="updateFilter('sourceType', $event.target.value)"
        >
          <option value="">Any source</option>
          <option v-for="row in sourceOptions" :key="row.key" :value="row.key">
            {{ displayType(row.key) }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="font-semibold text-slate-600">Relationship</span>
        <select
          class="va-control w-full"
          :value="selectedEdgeType"
          @change="updateFilter('edgeType', $event.target.value)"
        >
          <option value="">Any relationship</option>
          <option v-for="row in edgeOptions" :key="row.key" :value="row.key">
            {{ row.key }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>
      <label class="grid gap-1">
        <span class="font-semibold text-slate-600">Target</span>
        <select
          class="va-control w-full"
          :value="selectedTargetType"
          @change="updateFilter('targetType', $event.target.value)"
        >
          <option value="">Any target</option>
          <option v-for="row in targetOptions" :key="row.key" :value="row.key">
            {{ displayType(row.key) }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>
    </div>

    <svg
      class="mt-3 block h-auto w-full rounded border border-slate-200 bg-slate-50"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="Sankey edge overview by source type, relationship type, and target type"
    >
      <text :x="sourceX" y="8" class="fill-slate-500 text-[10px] font-semibold">Source</text>
      <text :x="edgeX" y="8" class="fill-slate-500 text-[10px] font-semibold">Relationship</text>
      <text :x="targetX + columnWidth" y="8" text-anchor="end" class="fill-slate-500 text-[10px] font-semibold">Target</text>

      <path
        v-for="link in sankeyData.sourceToEdge"
        :key="`source-edge-${link.from.key}-${link.to.key}`"
        :d="linkPath(link)"
        fill="none"
        :stroke="nodeColor(link.from)"
        :stroke-width="link.width"
        stroke-linecap="round"
        opacity="0.24"
      />
      <path
        v-for="link in sankeyData.edgeToTarget"
        :key="`edge-target-${link.from.key}-${link.to.key}`"
        :d="linkPath(link)"
        fill="none"
        :stroke="nodeColor(link.to)"
        :stroke-width="link.width"
        stroke-linecap="round"
        opacity="0.24"
      />

      <g v-for="node in [...sankeyData.sources, ...sankeyData.edges, ...sankeyData.targets]" :key="`${node.field}-${node.key}`">
        <rect
          :x="node.x"
          :y="node.y"
          :width="columnWidth"
          :height="node.height"
          rx="2"
          :fill="nodeColor(node)"
        >
          <title>{{ displayType(node.key) }}: {{ node.value.toLocaleString() }} links</title>
        </rect>
      </g>
    </svg>

    <div class="mt-3 grid gap-1.5">
      <button
        v-for="flow in topFlows"
        :key="flow.key"
        type="button"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-left text-xs hover:border-blue-300 hover:bg-blue-50"
        @click="selectFlow(flow)"
      >
        <span class="truncate">
          {{ displayType(flow.sourceType) }} -> {{ flow.edgeType }} -> {{ displayType(flow.targetType) }}
        </span>
        <span class="font-semibold tabular-nums text-slate-700">{{ flow.value.toLocaleString() }}</span>
      </button>
    </div>
  </article>
</template>