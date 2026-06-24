<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadGraph } from '../data/graphLoader'
import { findSailorShift, isArtist, normalizeGraph } from '../data/graphTransforms'
import { relationshipMatchesCategory } from '../data/relationshipSemantics'
import {
  buildEgoNetwork,
  buildNodeLinkSubgraph,
  computeArtistProfile,
  computeOverview,
  createGraphIndex,
  findArtistComparators,
  findShortestPath,
} from '../data/metrics'
import ArtistComparison from './ArtistComparison.vue'
import CategoricalBarChart from './CategoricalBarChart.vue'
import ConnectedComponents from './ConnectedComponents.vue'
import CurrentAnalysis from './CurrentAnalysis.vue'
import DegreeDistribution from './DegreeDistribution.vue'
import EgoNetwork from './EgoNetwork.vue'
import EntityDetail from './EntityDetail.vue'
import EntitySearch from './EntitySearch.vue'
import EvidenceTable from './EvidenceTable.vue'
import FilterImpact from './FilterImpact.vue'
import FilterPanel from './FilterPanel.vue'
import NodeLinkDiagram from './NodeLinkDiagram.vue'
import PathExplorer from './PathExplorer.vue'
import QualityExplorer from './QualityExplorer.vue'
import RelationshipDetail from './RelationshipDetail.vue'
import RelationshipPatternExplorer from './RelationshipPatternExplorer.vue'
import SummaryCards from './SummaryCards.vue'
import TimelineChart from './TimelineChart.vue'

defineOptions({
  name: 'DesignChallengeDashboard',
})

const loading = ref(true)
const error = ref('')
const graph = ref(null)
const graphIndex = ref(null)
const selectedNode = ref(null)
const focusHistory = ref([])
const selectedLinkId = ref('')
const pathTargetNode = ref(null)
const pathSelectionMode = ref(false)
const comparisonNode = ref(null)
const supportViewsReady = ref(false)
const filters = ref({
  nodeType: '',
  edgeType: '',
  sourceNodeType: '',
  targetNodeType: '',
  genre: '',
  nodeProperty: '',
  propertyValue: '',
  startYear: '',
  endYear: '',
})
const networkSettings = ref({
  depth: 2,
  nodeLimit: 50,
  relationshipFocus: 'all',
})
const nodeLinkLimit = 30
const nodeLinkDegreeRange = ref({ min: 0, max: 0 })
let supportViewsHandle = null
let supportViewsHandleType = null

const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.nodeType ||
      filters.value.edgeType ||
      filters.value.sourceNodeType ||
      filters.value.targetNodeType ||
      filters.value.genre ||
      filters.value.nodeProperty ||
      filters.value.propertyValue ||
      filters.value.startYear ||
      filters.value.endYear,
  ),
)
const hasNonRelationshipFilters = computed(() =>
  Boolean(
    filters.value.nodeType ||
      filters.value.genre ||
      filters.value.nodeProperty ||
      filters.value.propertyValue ||
      filters.value.startYear ||
      filters.value.endYear,
  ),
)
const fullOverview = computed(() =>
  graph.value
    ? computeOverview(graph.value, {
        includeSupport: supportViewsReady.value,
        index: graphIndex.value,
      })
    : null,
)
const availableYears = computed(() => fullOverview.value?.years.map((row) => row.year) ?? [])
const propertyOptions = computed(() => buildPropertyOptions(graph.value?.nodes ?? []))
const oceanusTimelineRows = computed(() => {
  const rows = fullOverview.value?.years ?? []
  const firstRelevantIndex = rows.findIndex((row) => row.oceanusWorks > 0)
  return firstRelevantIndex >= 0 ? rows.slice(firstRelevantIndex) : rows
})
const filteredGraph = computed(() => {
  if (!graph.value) return null
  return hasActiveFilters.value ? buildFilteredGraph(graph.value) : graph.value
})
const overview = computed(() => {
  if (!filteredGraph.value) return null
  return filteredGraph.value === graph.value
    ? fullOverview.value
    : computeOverview(filteredGraph.value, { includeSupport: supportViewsReady.value })
})
const nodeLinkDegreeDomain = computed(() => ({
  min: 0,
  max: overview.value?.maximumDegree ?? 0,
}))
const normalizedNodeLinkDegreeRange = computed(() => {
  const max = nodeLinkDegreeDomain.value.max
  return {
    min: Math.max(0, Math.min(nodeLinkDegreeRange.value.min, max)),
    max: Math.max(0, Math.min(nodeLinkDegreeRange.value.max || max, max)),
  }
})
const nodeLinkSubgraph = computed(() =>
  filteredGraph.value
    ? buildNodeLinkSubgraph(
        filteredGraph.value,
        nodeLinkLimit,
        normalizedNodeLinkDegreeRange.value,
        overview.value?.degreeById,
      )
    : null,
)
const patternContextOverview = computed(() => {
  if (!graph.value) return null
  if (!hasNonRelationshipFilters.value) return fullOverview.value
  return computeOverview(buildFilteredGraph(graph.value, { ignoreRelationshipPattern: true }), {
    includeSupport: false,
  })
})
const effectiveSelectedNode = computed(() => {
  if (!filteredGraph.value || !overview.value) return selectedNode.value
  if (selectedNode.value && filteredGraph.value.nodeById.has(selectedNode.value.id)) {
    return filteredGraph.value.nodeById.get(selectedNode.value.id)
  }

  return overview.value.topEntities[0] ?? null
})
const egoNetwork = computed(() =>
  graph.value && effectiveSelectedNode.value
    ? buildEgoNetwork(
        graph.value,
        effectiveSelectedNode.value.id,
        networkSettings.value.depth,
        networkSettings.value.nodeLimit,
        fullOverview.value?.degreeById,
        graphIndex.value?.adjacency,
      )
    : null,
)
const selectedRelationship = computed(
  () => graph.value?.links.find((link) => link.id === selectedLinkId.value) ?? null,
)
const evidenceLinks = computed(() =>
  (egoNetwork.value?.links ?? []).filter((link) =>
    relationshipMatchesCategory(link, networkSettings.value.relationshipFocus),
  ),
)
const filteredTimelineRows = computed(() =>
  (overview.value?.years ?? []).filter((row) => isYearInRange(row.year)),
)
const connectionPath = computed(() =>
  filteredGraph.value && effectiveSelectedNode.value && pathTargetNode.value
    ? findShortestPath(
        filteredGraph.value,
        effectiveSelectedNode.value.id,
        pathTargetNode.value.id,
        6,
        filteredGraph.value === graph.value ? graphIndex.value?.pathAdjacency : null,
      )
    : null,
)
const fullGraphPath = computed(() =>
  hasFilters.value &&
  !connectionPath.value &&
  graph.value &&
  effectiveSelectedNode.value &&
  pathTargetNode.value
    ? findShortestPath(
        graph.value,
        effectiveSelectedNode.value.id,
        pathTargetNode.value.id,
        6,
        graphIndex.value?.pathAdjacency,
      )
    : null,
)
const pathNodeIds = computed(() => connectionPath.value?.nodes.map((node) => node.id) ?? [])
const pathLinkIds = computed(() => connectionPath.value?.links.map((link) => link.id) ?? [])
const visibleArtists = computed(() => (filteredGraph.value?.nodes ?? []).filter(isArtist))
const focusArtistProfile = computed(() =>
  effectiveSelectedNode.value && isArtist(effectiveSelectedNode.value)
    ? computeArtistProfile(filteredGraph.value, effectiveSelectedNode.value.id)
    : null,
)
const comparisonCandidates = computed(() =>
  focusArtistProfile.value
    ? findArtistComparators(filteredGraph.value, focusArtistProfile.value.node.id, 5)
    : [],
)
const comparisonProfile = computed(() =>
  comparisonNode.value
    ? computeArtistProfile(filteredGraph.value, comparisonNode.value.id)
    : null,
)
const selectedDegree = computed(
  () => overview.value?.degreeById.get(effectiveSelectedNode.value?.id)?.degree ?? null,
)
const currentAnalysisSections = computed(() => {
  if (!overview.value) return []

  const topRelationship = overview.value.edgeTypes[0]
  const sailorCreditedWorks = filteredTimelineRows.value.reduce(
    (total, row) => total + row.sailorCreditedOceanusWorks,
    0,
  )
  const period =
    filters.value.startYear || filters.value.endYear
      ? `${filters.value.startYear || availableYears.value[0]}-${filters.value.endYear || availableYears.value.at(-1)}`
      : 'all available release years'
  const activeFilters = [
    filters.value.nodeType && `entity: ${filters.value.nodeType}`,
    filters.value.edgeType && `relationship: ${filters.value.edgeType}`,
    (filters.value.sourceNodeType || filters.value.targetNodeType) &&
      `direction: ${filters.value.sourceNodeType || 'any'} -> ${filters.value.targetNodeType || 'any'}`,
    filters.value.genre && `genre: ${filters.value.genre}`,
    filters.value.nodeProperty &&
      filters.value.propertyValue &&
      `${filters.value.nodeProperty}: ${filters.value.propertyValue}`,
    (filters.value.startYear || filters.value.endYear) && `period: ${period}`,
  ].filter(Boolean)

  return [
    {
      label: 'Current takeaway',
      value: topRelationship
        ? `${topRelationship.label} is the most frequent visible relationship (${topRelationship.value.toLocaleString()}). ${sailorCreditedWorks.toLocaleString()} Oceanus Folk works in ${period} are directly credited to Sailor Shift as performer, composer, producer, or lyricist.`
        : 'No relationships remain under the current filters.',
    },
    {
      label: 'Visible scope',
      value: `${overview.value.totalNodes.toLocaleString()} of ${fullOverview.value.totalNodes.toLocaleString()} entities and ${overview.value.totalLinks.toLocaleString()} of ${fullOverview.value.totalLinks.toLocaleString()} relationships. ${activeFilters.length ? activeFilters.join('; ') : 'No global filters are active.'}`,
    },
  ]
})
const hasFilters = hasActiveFilters
onMounted(async () => {
  try {
    const rawGraph = await loadGraph()
    const normalizedGraph = normalizeGraph(rawGraph)
    const index = createGraphIndex(normalizedGraph)
    const graphOverview = computeOverview(normalizedGraph, {
      includeSupport: false,
      index,
    })

    graphIndex.value = index
    graph.value = normalizedGraph
    selectedNode.value = findSailorShift(normalizedGraph.nodes) ?? graphOverview.topEntities[0] ?? null
    focusHistory.value = []
    scheduleSupportViews()
  } catch (caughtError) {
    error.value = caughtError.message
  } finally {
    loading.value = false
  }
})

watch(
  () => [
    focusArtistProfile.value?.node.id,
    filteredGraph.value?.nodes.length,
    filteredGraph.value?.links.length,
  ],
  () => {
    if (!focusArtistProfile.value) {
      comparisonNode.value = null
      return
    }
    const currentIsValid =
      comparisonNode.value &&
      comparisonNode.value.id !== focusArtistProfile.value.node.id &&
      filteredGraph.value?.nodeById.has(comparisonNode.value.id)
    if (!currentIsValid) {
      comparisonNode.value = comparisonCandidates.value[0]?.node ?? null
    }
  },
  { flush: 'post' },
)
watch(
  () => nodeLinkDegreeDomain.value.max,
  (maxDegree) => {
    if (!maxDegree) return
    const current = nodeLinkDegreeRange.value
    nodeLinkDegreeRange.value = {
      min: Math.max(0, Math.min(current.min, maxDegree)),
      max: current.max ? Math.min(current.max, maxDegree) : maxDegree,
    }
  },
  { immediate: true },
)

function selectNode(node, options = {}) {
  const nextNode = graph.value?.nodeById.get(node.id) ?? node
  const currentNode = effectiveSelectedNode.value
  if (options.trackHistory !== false && currentNode && currentNode.id !== nextNode.id) {
    focusHistory.value = [...focusHistory.value.slice(-9), currentNode.id]
  }
  selectedNode.value = nextNode
  selectedLinkId.value = ''
}

function selectSearchedNode(node) {
  if (!filteredGraph.value?.nodeById.has(node.id)) {
    clearFilters()
  }
  selectNode(node)
}

function selectLink(link) {
  selectedLinkId.value = link.id
}

function selectPathTarget(node) {
  if (node.id === effectiveSelectedNode.value?.id) return
  pathTargetNode.value = node
  selectedLinkId.value = ''
  pathSelectionMode.value = false
}

function selectComparison(node) {
  comparisonNode.value = filteredGraph.value?.nodeById.get(node.id) ?? node
}

function togglePathMode() {
  pathSelectionMode.value = !pathSelectionMode.value
}

function updateFilters(nextFilters) {
  filters.value = nextFilters
  selectedLinkId.value = ''
}

function setFilter(key, value) {
  filters.value = {
    ...filters.value,
    [key]: filters.value[key] === value ? '' : value,
  }
  selectedLinkId.value = ''
}

function clearFilters() {
  filters.value = {
    nodeType: '',
    edgeType: '',
    sourceNodeType: '',
    targetNodeType: '',
    genre: '',
    nodeProperty: '',
    propertyValue: '',
    startYear: '',
    endYear: '',
  }
}

function resetFilters() {
  clearFilters()
  selectedNode.value = findSailorShift(graph.value?.nodes ?? []) ?? fullOverview.value?.topEntities[0] ?? null
  focusHistory.value = []
  selectedLinkId.value = ''
}

function updateNetworkSettings(nextSettings) {
  networkSettings.value = nextSettings
  selectedLinkId.value = ''
}
function updateNodeLinkDegreeRange(range) {
  const max = nodeLinkDegreeDomain.value.max
  nodeLinkDegreeRange.value = {
    min: Math.max(0, Math.min(Number(range.min ?? 0), max)),
    max: Math.max(0, Math.min(Number(range.max ?? max), max)),
  }
}

function selectRelationshipPattern(pattern) {
  const nextSource = pattern?.sourceType ?? ''
  const nextEdge = pattern?.edgeType ?? ''
  const nextTarget = pattern?.targetType ?? ''
  const isCurrent =
    filters.value.sourceNodeType === nextSource &&
    filters.value.edgeType === nextEdge &&
    filters.value.targetNodeType === nextTarget

  filters.value = {
    ...filters.value,
    nodeType: '',
    edgeType: !pattern || isCurrent ? '' : nextEdge,
    sourceNodeType: !pattern || isCurrent ? '' : nextSource,
    targetNodeType: !pattern || isCurrent ? '' : nextTarget,
  }
  selectedLinkId.value = ''
}

function inspectQualityLink(link) {
  selectedNode.value = link.sourceNode
  selectedLinkId.value = link.id
}

function selectYear(year) {
  const selectedYear = String(year)
  const isAlreadySelected =
    filters.value.startYear === selectedYear && filters.value.endYear === selectedYear

  filters.value = {
    ...filters.value,
    startYear: isAlreadySelected ? '' : selectedYear,
    endYear: isAlreadySelected ? '' : selectedYear,
  }
  selectedLinkId.value = ''
}

function buildFilteredGraph(sourceGraph, options = {}) {
  const contextSets = []

  if (filters.value.genre) {
    const seedIds = new Set(
      sourceGraph.nodes.filter((node) => node.genre === filters.value.genre).map((node) => node.id),
    )
    contextSets.push(expandWithDirectContext(sourceGraph, seedIds))
  }

  if (filters.value.startYear || filters.value.endYear) {
    const datedWorkIds = new Set(
      sourceGraph.nodes
        .filter((node) => ['song', 'album'].includes(node.nodeTypeKey))
        .filter((node) => isYearInRange(node.releaseYear))
        .map((node) => node.id),
    )
    contextSets.push(expandWithDirectContext(sourceGraph, datedWorkIds))
  }

  if (filters.value.nodeProperty && filters.value.propertyValue) {
    const propertyIds = new Set(
      sourceGraph.nodes
        .filter(
          (node) =>
            normalizePropertyValue(node.rawProperties?.[filters.value.nodeProperty]) ===
            filters.value.propertyValue,
        )
        .map((node) => node.id),
    )
    contextSets.push(expandWithDirectContext(sourceGraph, propertyIds))
  }

  let visibleNodes = sourceGraph.nodes.filter((node) => {
    if (contextSets.some((ids) => !ids.has(node.id))) return false
    if (filters.value.nodeType && node.nodeType !== filters.value.nodeType) return false
    return true
  })
  const visibleIds = new Set(visibleNodes.map((node) => node.id))
  const directionalFilterActive =
    filters.value.sourceNodeType || filters.value.targetNodeType
  const visibleLinks = sourceGraph.links.filter((link) => {
    if (!visibleIds.has(link.source) || !visibleIds.has(link.target)) return false
    if (
      !options.ignoreRelationshipPattern &&
      filters.value.edgeType &&
      link.edgeType !== filters.value.edgeType
    ) {
      return false
    }
    if (
      !options.ignoreDirection &&
      filters.value.sourceNodeType &&
      link.sourceNode?.nodeType !== filters.value.sourceNodeType
    ) {
      return false
    }
    if (
      !options.ignoreDirection &&
      filters.value.targetNodeType &&
      link.targetNode?.nodeType !== filters.value.targetNodeType
    ) {
      return false
    }
    return true
  })
  if (directionalFilterActive && !options.ignoreDirection && !options.ignoreRelationshipPattern) {
    const endpointIds = new Set(visibleLinks.flatMap((link) => [link.source, link.target]))
    visibleNodes = visibleNodes.filter((node) => endpointIds.has(node.id))
  }

  return {
    ...sourceGraph,
    nodes: visibleNodes,
    links: visibleLinks,
    nodeById: new Map(visibleNodes.map((node) => [node.id, node])),
  }
}

function expandWithDirectContext(sourceGraph, seedIds) {
  const contextIds = new Set(seedIds)

  for (const link of sourceGraph.links) {
    if (seedIds.has(link.source) || seedIds.has(link.target)) {
      contextIds.add(link.source)
      contextIds.add(link.target)
    }
  }

  return contextIds
}

function isYearInRange(year) {
  if (!year) return false
  const start = Number(filters.value.startYear)
  const end = Number(filters.value.endYear)
  if (start && year < start) return false
  if (end && year > end) return false
  return true
}

function buildPropertyOptions(nodes) {
  const excluded = new Set([
    'genre',
    'release_date',
    'written_date',
    'notoriety_date',
    'stage_name',
  ])
  const valuesByProperty = new Map()

  for (const node of nodes) {
    for (const [key, value] of Object.entries(node.rawProperties ?? {})) {
      if (excluded.has(key) || value === null || value === undefined || value === '') continue
      if (!valuesByProperty.has(key)) valuesByProperty.set(key, new Set())
      valuesByProperty.get(key).add(normalizePropertyValue(value))
    }
  }

  return Array.from(valuesByProperty, ([key, values]) => ({
    key,
    label: key
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    values: Array.from(values).sort((a, b) => a.localeCompare(b)),
  }))
    .filter((property) => property.values.length > 1 && property.values.length <= 12)
    .sort((a, b) => a.label.localeCompare(b.label))
}

function normalizePropertyValue(value) {
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  return String(value)
}
function scheduleSupportViews() {
  const enableSupportViews = () => {
    supportViewsHandle = null
    supportViewsHandleType = null
    supportViewsReady.value = true
  }

  if ('requestIdleCallback' in window) {
    supportViewsHandleType = 'idle'
    supportViewsHandle = window.requestIdleCallback(enableSupportViews, { timeout: 1200 })
    return
  }

  supportViewsHandleType = 'timeout'
  supportViewsHandle = window.setTimeout(enableSupportViews, 450)
}

onBeforeUnmount(() => {
  if (supportViewsHandle === null) return
  if (supportViewsHandleType === 'idle' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(supportViewsHandle)
  } else {
    window.clearTimeout(supportViewsHandle)
  }
})
</script>

<template>
  <section class="va-dashboard">
    <div class="va-hero">
      <p class="text-xs font-semibold text-blue-700">VAST 2025 Design Challenge</p>
      <div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-950">
            How did Oceanus Folk evolve, and where does Sailor Shift fit?
          </h2>
          <p class="va-panel-copy mt-2 max-w-6xl">
            A visual analytics prototype for the official MC1 knowledge graph, combining temporal
            evidence, linked entities, and traceable relationship records.
          </p>
        </div>
        <div
          v-if="effectiveSelectedNode"
          class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"
        >
          Focus: <span class="font-semibold">{{ effectiveSelectedNode.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="va-card va-card-pad text-slate-600">
      Loading MC1 graph...
    </div>

    <div v-else-if="error" class="rounded-md border border-rose-200 bg-rose-50 p-6 text-rose-800">
      {{ error }}
    </div>

    <template v-else-if="overview && fullOverview">
      <EntitySearch
        :nodes="graph.nodes"
        :selected-id="effectiveSelectedNode?.id"
        @select="selectSearchedNode"
      />

      <FilterPanel
        :filters="filters"
        :node-types="fullOverview.nodeTypes"
        :edge-types="fullOverview.edgeTypes"
        :genres="fullOverview.allGenres"
        :years="availableYears"
        :property-options="propertyOptions"
        @update:filters="updateFilters"
        @reset="resetFilters"
      />

      <SummaryCards :overview="overview" :full-overview="fullOverview" />

      <FilterImpact
        :overview="overview"
        :full-overview="fullOverview"
        :active="hasFilters"
      />

      <div
        v-if="overview.totalNodes === 0"
        class="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      >
        <p class="font-semibold">No entities match the active filter combination.</p>
        <p class="mt-1 text-amber-800">
          Clear one or more filters to restore the linked charts and network context.
        </p>
        <button type="button" class="va-button mt-3" @click="resetFilters">Reset filters</button>
      </div>

      <CurrentAnalysis :sections="currentAnalysisSections" />

      <section class="va-workspace-grid">
        <NodeLinkDiagram
          v-if="nodeLinkSubgraph"
          class="va-workspace-node"
          :nodes="nodeLinkSubgraph.nodes"
          :links="nodeLinkSubgraph.links"
          :total-nodes="nodeLinkSubgraph.totalNodes"
          :total-links="nodeLinkSubgraph.totalLinks"
          :matching-nodes="nodeLinkSubgraph.matchingNodes"
          :node-limit="nodeLinkSubgraph.nodeLimit"
          :degree-min="nodeLinkSubgraph.degreeMin"
          :degree-max="nodeLinkSubgraph.degreeMax"
          :graph-max-degree="nodeLinkSubgraph.graphMaxDegree"
          :selected-node-id="effectiveSelectedNode?.id"
          @select-node="selectNode"
          @select-link="selectLink"
          @update-degree-range="updateNodeLinkDegreeRange"
        />

        <aside class="va-workspace-side">
          <RelationshipPatternExplorer
            :patterns="patternContextOverview.relationshipPatterns.patterns"
            :source-options="patternContextOverview.relationshipPatterns.sourceOptions"
            :edge-options="patternContextOverview.relationshipPatterns.edgeOptions"
            :target-options="patternContextOverview.relationshipPatterns.targetOptions"
            :source-to-edge="patternContextOverview.relationshipPatterns.sourceToEdge"
            :edge-to-target="patternContextOverview.relationshipPatterns.edgeToTarget"
            :total-relationships="patternContextOverview.totalLinks"
            :selected-source-type="filters.sourceNodeType"
            :selected-edge-type="filters.edgeType"
            :selected-target-type="filters.targetNodeType"
            @select="selectRelationshipPattern"
          />

          <EgoNetwork
            v-if="egoNetwork && effectiveSelectedNode"
            class="va-workspace-ego"
            :nodes="egoNetwork.nodes"
            :links="egoNetwork.links"
            :center-id="effectiveSelectedNode.id"
            :network-settings="networkSettings"
            :selected-link-id="selectedLinkId"
            :path-node-ids="pathNodeIds"
            :path-link-ids="pathLinkIds"
            :path-selection-mode="pathSelectionMode"
            @select-node="selectNode"
            @select-path-target="selectPathTarget"
            @select-link="selectLink"
            @update-network-settings="updateNetworkSettings"
          />
        </aside>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <article class="va-card va-card-pad">
          <EntityDetail :node="effectiveSelectedNode" />

          <p v-if="hasFilters" class="va-warning-note mt-3">
            Active filters define the node-link diagram; the ego network keeps the selected node's
            original graph context.
          </p>

          <RelationshipDetail
            class="mt-5 border-t border-slate-200 pt-5"
            :link="selectedRelationship"
            @filter-type="setFilter('edgeType', $event)"
            @select-node="selectNode"
            @clear="selectedLinkId = ''"
          />
        </article>
        <PathExplorer
          :nodes="graph.nodes"
          :source-node="effectiveSelectedNode"
          :target-node="pathTargetNode"
          :path="connectionPath"
          :full-graph-path="fullGraphPath"
          :filters-active="hasFilters"
          :active="pathSelectionMode"
          @select-target="selectPathTarget"
          @select-node="selectNode"
          @select-link="selectLink"
          @clear="pathTargetNode = null"
          @toggle-mode="togglePathMode"
        />
      </section>

      <section v-if="supportViewsReady" class="va-support-grid">
        <TimelineChart
          :rows="oceanusTimelineRows"
          :start-year="filters.startYear"
          :end-year="filters.endYear"
          @select-year="selectYear"
        />

        <CategoricalBarChart
          title="Top Known Genres"
          subtitle="Which known genres dominate the visible musical works?"
          :rows="overview.genres"
          :selected="filters.genre"
          :limit="10"
          expandable
          expand-label="Show all genres"
          color="#cc6677"
          @select="setFilter('genre', $event)"
        />
      </section>

      <section v-if="supportViewsReady" class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <DegreeDistribution
          :rows="overview.degreeDistribution"
          :median="overview.medianDegree"
          :maximum="overview.maximumDegree"
          :focus-degree="selectedDegree"
          :top-entities="overview.topEntities"
          :focus-id="effectiveSelectedNode?.id"
          @select="selectNode"
        />

        <ConnectedComponents
          :summary="overview.connectedComponents"
          :focus-id="effectiveSelectedNode?.id"
        />

        <article class="va-card va-card-pad xl:col-span-2">
          <h3 class="text-sm font-semibold text-slate-950">Data Quality Signals</h3>
          <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <dt class="text-slate-600">Works with known genre</dt>
              <dd class="mt-1 font-medium tabular-nums text-slate-950">
                {{ overview.knownGenreWorkCount.toLocaleString() }} /
                {{ overview.workCount.toLocaleString() }}
              </dd>
            </div>
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <dt class="text-slate-600">Works with release year</dt>
              <dd class="mt-1 font-medium tabular-nums text-slate-950">
                {{ overview.datedWorkCount.toLocaleString() }} /
                {{ overview.workCount.toLocaleString() }}
              </dd>
            </div>
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <dt class="text-slate-600">Creative-role links</dt>
              <dd class="mt-1 font-medium text-slate-950">
                {{ overview.creativeRoleLinks.toLocaleString() }}
              </dd>
            </div>
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <dt class="text-slate-600">Performance / recording links</dt>
              <dd class="mt-1 font-medium text-slate-950">
                {{ overview.performanceLinks.toLocaleString() }}
              </dd>
            </div>
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2 xl:col-span-1">
              <dt class="text-slate-600">Influence-style links</dt>
              <dd class="mt-1 font-medium text-slate-950">
                {{ overview.influenceLinks.toLocaleString() }}
              </dd>
            </div>
          </dl>
        </article>
      </section>
      <EvidenceTable v-if="supportViewsReady"
        :links="evidenceLinks"
        :selected-link-id="selectedLinkId"
        :center-label="effectiveSelectedNode?.label"
        :network-depth="networkSettings.depth"
        @select-link="selectLink"
        @select-node="selectNode"
      />

      <section v-if="supportViewsReady">
        <QualityExplorer
          :signals="overview.qualitySignals"
          @inspect-link="inspectQualityLink"
        />
      </section>

      <ArtistComparison
        v-if="supportViewsReady && focusArtistProfile"
        :focus-profile="focusArtistProfile"
        :comparison-profile="comparisonProfile"
        :candidates="comparisonCandidates"
        :artists="visibleArtists"
        @select-comparison="selectComparison"
        @select-focus="selectNode"
      />
    </template>
  </section>
</template>



