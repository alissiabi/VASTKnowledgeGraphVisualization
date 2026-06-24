import { countBy, isAlbum, isArtist, isSong } from './graphTransforms.js'
import {
  isCreativeRoleLink,
  isInfluenceLink,
  isPerformanceLink,
  relationshipCategory,
} from './relationshipSemantics.js'

const CREATIVE_ROLE_TYPES = new Set(['performerof', 'composerof', 'producerof', 'lyricistof'])

export function createGraphIndex(graph) {
  return {
    degreeById: computeDegrees(graph),
    adjacency: buildAdjacency(graph),
    pathAdjacency: buildPathAdjacency(graph),
    relationshipPatterns: computeRelationshipPatterns(graph),
  }
}

export function computeDegrees(graph) {
  const degreeById = new Map(
    graph.nodes.map((node) => [node.id, { degree: 0, inDegree: 0, outDegree: 0 }]),
  )

  for (const link of graph.links) {
    const sourceDegree = degreeById.get(link.source)
    const targetDegree = degreeById.get(link.target)

    if (sourceDegree) {
      sourceDegree.degree += 1
      sourceDegree.outDegree += 1
    }

    if (targetDegree) {
      targetDegree.degree += 1
      targetDegree.inDegree += 1
    }
  }

  return degreeById
}

export function computeOverview(graph, options = {}) {
  const includeSupport = options.includeSupport !== false
  const degreeById = options.index?.degreeById ?? computeDegrees(graph)
  const genreNodes = []
  const topEntities = []
  const relationshipCounts = {
    creativeRoleLinks: 0,
    performanceLinks: 0,
    membershipLinks: 0,
    distributionLinks: 0,
    influenceLinks: 0,
  }
  let artistCount = 0
  let songCount = 0
  let albumCount = 0
  let workCount = 0
  let datedWorkCount = 0
  let knownGenreWorkCount = 0

  for (const node of graph.nodes) {
    if (isArtist(node)) artistCount += 1
    if (isSong(node)) songCount += 1
    if (isAlbum(node)) albumCount += 1
    if (isSong(node) || isAlbum(node)) {
      workCount += 1
      if (node.releaseYear !== null) datedWorkCount += 1
      if (node.genre !== 'Unknown') knownGenreWorkCount += 1
    }
    if (node.genre !== 'Unknown') genreNodes.push(node)

    const degree = degreeById.get(node.id) ?? { degree: 0, inDegree: 0, outDegree: 0 }
    topEntities.push({
      id: node.id,
      label: node.label,
      nodeType: node.nodeType,
      degree: degree.degree,
      inDegree: degree.inDegree,
      outDegree: degree.outDegree,
    })
  }

  for (const link of graph.links) {
    if (isCreativeRoleLink(link)) relationshipCounts.creativeRoleLinks += 1
    if (isPerformanceLink(link)) relationshipCounts.performanceLinks += 1
    if (isInfluenceLink(link)) relationshipCounts.influenceLinks += 1
    const category = relationshipCategory(link)
    if (category === 'membership') relationshipCounts.membershipLinks += 1
    if (category === 'distribution') relationshipCounts.distributionLinks += 1
  }

  const genreCounts = countBy(genreNodes, (node) => node.genre)

  return {
    totalNodes: graph.nodes.length,
    totalLinks: graph.links.length,
    artistCount,
    songCount,
    albumCount,
    workCount,
    datedWorkCount,
    knownGenreWorkCount,
    nodeTypes: countBy(graph.nodes, (node) => node.nodeType),
    edgeTypes: countBy(graph.links, (link) => link.edgeType),
    allGenres: genreCounts,
    genres: genreCounts,
    years: includeSupport ? computeTimeline(graph) : [],
    degreeDistribution: includeSupport ? computeDegreeDistribution(degreeById) : [],
    connectedComponents: includeSupport
      ? computeConnectedComponents(graph, options.index?.adjacency)
      : emptyConnectedComponents(),
    relationshipPatterns: options.index?.relationshipPatterns ?? computeRelationshipPatterns(graph),
    qualitySignals: includeSupport ? computeQualitySignals(graph) : emptyQualitySignals(),
    topEntities: topEntities
      .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))
      .slice(0, 12),
    ...relationshipCounts,
    medianDegree: computeMedianDegree(degreeById),
    maximumDegree: d3MaximumDegree(degreeById),
    degreeById,
  }
}

function emptyConnectedComponents() {
  return {
    total: 0,
    isolatedCount: 0,
    largest: null,
    components: [],
  }
}

function emptyQualitySignals() {
  return {
    chronology: { count: 0, rows: [] },
    missingYears: { count: 0, rows: [] },
    duplicates: { count: 0, rows: [] },
  }
}
export function computeConnectedComponents(graph, precomputedAdjacency = null) {
  const adjacency = precomputedAdjacency ?? buildAdjacency(graph)
  const visited = new Set()
  const components = []

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue

    const nodeIds = []
    const stack = [node.id]
    visited.add(node.id)

    while (stack.length) {
      const currentId = stack.pop()
      nodeIds.push(currentId)

      for (const neighborId of adjacency.get(currentId) ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          stack.push(neighborId)
        }
      }
    }

    const idSet = new Set(nodeIds)
    const links = graph.links.filter((link) => idSet.has(link.source) && idSet.has(link.target))
    const typeCounts = countBy(
      nodeIds.map((id) => graph.nodeById.get(id)).filter(Boolean),
      (node) => node.nodeType,
    )

    components.push({
      id: components.length + 1,
      nodeIds,
      nodeCount: nodeIds.length,
      linkCount: links.length,
      dominantType: typeCounts[0]?.label ?? 'Unknown',
    })
  }

  const sortedComponents = components.sort(
    (a, b) => b.nodeCount - a.nodeCount || b.linkCount - a.linkCount || a.id - b.id,
  )

  return {
    total: sortedComponents.length,
    isolatedCount: sortedComponents.filter((component) => component.nodeCount === 1).length,
    largest: sortedComponents[0] ?? null,
    components: sortedComponents,
  }
}
export function computeRelationshipPatterns(graph) {
  const counts = new Map()
  const sourceCounts = new Map()
  const edgeCounts = new Map()
  const targetCounts = new Map()
  const sourceToEdgeCounts = new Map()
  const edgeToTargetCounts = new Map()

  for (const link of graph.links) {
    const sourceType = link.sourceNode?.nodeType ?? 'Unknown'
    const targetType = link.targetNode?.nodeType ?? 'Unknown'
    const edgeType = link.edgeType ?? 'Unknown'
    const key = `${sourceType}|${edgeType}|${targetType}`
    const row = counts.get(key) ?? {
      key,
      sourceType,
      edgeType,
      targetType,
      value: 0,
    }
    row.value += 1
    counts.set(key, row)

    incrementCount(sourceCounts, sourceType, 'sourceType')
    incrementCount(edgeCounts, edgeType, 'edgeType')
    incrementCount(targetCounts, targetType, 'targetType')
    incrementPairCount(sourceToEdgeCounts, sourceType, edgeType)
    incrementPairCount(edgeToTargetCounts, edgeType, targetType)
  }

  const patterns = Array.from(counts.values()).sort(
    (a, b) =>
      b.value - a.value ||
      a.sourceType.localeCompare(b.sourceType) ||
      a.edgeType.localeCompare(b.edgeType) ||
      a.targetType.localeCompare(b.targetType),
  )

  return {
    patterns,
    sourceOptions: sortedCountRows(sourceCounts),
    edgeOptions: sortedCountRows(edgeCounts),
    targetOptions: sortedCountRows(targetCounts),
    sourceToEdge: sortedPairRows(sourceToEdgeCounts),
    edgeToTarget: sortedPairRows(edgeToTargetCounts),
    total: patterns.length,
    maximum: patterns[0]?.value ?? 0,
  }
}

function incrementCount(counts, key, field) {
  const row = counts.get(key) ?? { key, field, value: 0 }
  row.value += 1
  counts.set(key, row)
}

function incrementPairCount(counts, from, to) {
  const key = `${from}|${to}`
  const row = counts.get(key) ?? { key, from, to, value: 0 }
  row.value += 1
  counts.set(key, row)
}

function sortedCountRows(counts) {
  return Array.from(counts.values()).sort(
    (a, b) => b.value - a.value || String(a.key).localeCompare(String(b.key)),
  )
}

function sortedPairRows(counts) {
  return Array.from(counts.values()).sort(
    (a, b) =>
      b.value - a.value ||
      String(a.from).localeCompare(String(b.from)) ||
      String(a.to).localeCompare(String(b.to)),
  )
}

export function computeQualitySignals(graph) {
  const chronologyRows = []
  const missingYearRows = []
  const duplicateGroups = new Map()

  for (const link of graph.links) {
    if (isInfluenceLink(link)) {
      const sourceYear = link.sourceNode?.releaseYear ?? null
      const targetYear = link.targetNode?.releaseYear ?? null
      if (!sourceYear || !targetYear) {
        missingYearRows.push({
          key: `missing-${link.id}`,
          link,
          detail: `${sourceYear ?? '?'} -> ${targetYear ?? '?'}`,
        })
      } else if (sourceYear < targetYear) {
        chronologyRows.push({
          key: `chronology-${link.id}`,
          link,
          detail: `${sourceYear} -> ${targetYear}`,
        })
      }
    }

    const duplicateKey = `${link.source}|${link.edgeType}|${link.target}`
    if (!duplicateGroups.has(duplicateKey)) duplicateGroups.set(duplicateKey, [])
    duplicateGroups.get(duplicateKey).push(link)
  }

  const duplicateRows = Array.from(duplicateGroups.values())
    .filter((links) => links.length > 1)
    .map((links) => ({
      key: `duplicate-${links[0].id}`,
      link: links[0],
      detail: `${links.length} records`,
    }))

  return {
    chronology: { count: chronologyRows.length, rows: chronologyRows },
    missingYears: { count: missingYearRows.length, rows: missingYearRows },
    duplicates: { count: duplicateRows.length, rows: duplicateRows },
  }
}

export function computeDegreeDistribution(degreeById) {
  const bins = [
    { label: '0', min: 0, max: 0, value: 0 },
    { label: '1', min: 1, max: 1, value: 0 },
    { label: '2-3', min: 2, max: 3, value: 0 },
    { label: '4-7', min: 4, max: 7, value: 0 },
    { label: '8-15', min: 8, max: 15, value: 0 },
    { label: '16-31', min: 16, max: 31, value: 0 },
    { label: '32-63', min: 32, max: 63, value: 0 },
    { label: '64+', min: 64, max: null, value: 0 },
  ]

  for (const degree of degreeById.values()) {
    const bin = bins.find(
      (candidate) =>
        degree.degree >= candidate.min &&
        (candidate.max === null || degree.degree <= candidate.max),
    )
    if (bin) bin.value += 1
  }

  return bins
}

export function computeTimeline(graph) {
  const byYear = new Map()
  const sailorShift = graph.nodes.find((node) => node.label.toLowerCase() === 'sailor shift')
  const sailorWorkIds = new Set(
    graph.links
      .filter((link) => link.source === sailorShift?.id)
      .filter((link) => CREATIVE_ROLE_TYPES.has(link.edgeTypeKey))
      .map((link) => link.target),
  )

  for (const node of graph.nodes) {
    if (!node.releaseYear || (!isSong(node) && !isAlbum(node))) continue
    const row = getTimelineRow(byYear, node.releaseYear)
    row.nodes += 1
    if (isSong(node)) row.songs += 1
    if (isAlbum(node)) row.albums += 1
    if (node.genre === 'Oceanus Folk') {
      row.oceanusWorks += 1
      if (sailorWorkIds.has(node.id)) row.sailorCreditedOceanusWorks += 1
    }
  }

  for (const link of graph.links) {
    const year = link.year ?? link.sourceNode?.year ?? link.targetNode?.year
    if (!year) continue
    const row = getTimelineRow(byYear, year)
    row.links += 1
    if (isCreativeRoleLink(link)) row.creativeRoles += 1
    if (isPerformanceLink(link)) row.performances += 1
    if (isInfluenceLink(link)) row.influences += 1
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year)
}

export function buildNodeLinkSubgraph(graph, nodeLimit = 100, degreeRange = {}, precomputedDegreeById = null) {
  if (!graph) {
    return {
      nodes: [],
      links: [],
      totalNodes: 0,
      totalLinks: 0,
      matchingNodes: 0,
      nodeLimit,
      degreeMin: 0,
      degreeMax: 0,
    }
  }

  const degreeById = precomputedDegreeById ?? computeDegrees(graph)
  const degrees = Array.from(degreeById.values(), (row) => row.degree)
  const graphMaxDegree = d3MaximumDegree(degreeById)
  const degreeMin = Math.max(0, Number(degreeRange.min ?? 0))
  const degreeMax = Math.min(
    graphMaxDegree,
    Number.isFinite(Number(degreeRange.max)) ? Number(degreeRange.max) : graphMaxDegree,
  )
  const candidates = graph.nodes
    .map((node) => ({ id: node.id, degree: degreeById.get(node.id)?.degree ?? 0, label: node.label }))
    .filter((node) => node.degree >= degreeMin && node.degree <= degreeMax)
    .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))

  const selectedIds = candidates.slice(0, nodeLimit).map((node) => node.id)
  const selected = new Set(selectedIds)

  return {
    nodes: graph.nodes
      .filter((node) => selected.has(node.id))
      .map((node) => ({
        ...node,
        degree: degreeById.get(node.id)?.degree ?? 0,
      })),
    links: graph.links.filter((link) => selected.has(link.source) && selected.has(link.target)),
    totalNodes: graph.nodes.length,
    totalLinks: graph.links.length,
    matchingNodes: candidates.length,
    nodeLimit,
    degreeMin,
    degreeMax,
    graphMinDegree: degrees.length ? Math.min(...degrees) : 0,
    graphMaxDegree,
  }
}
export function buildEgoNetwork(graph, centerId, depth = 1, nodeLimit = 50, precomputedDegreeById = null, precomputedAdjacency = null) {
  if (!centerId) return { nodes: [], links: [] }

  const adjacency = precomputedAdjacency ?? buildAdjacency(graph)
  const distanceById = new Map([[centerId, 0]])
  let frontier = [centerId]

  for (let currentDepth = 0; currentDepth < depth; currentDepth += 1) {
    const next = []
    for (const id of frontier) {
      for (const neighborId of adjacency.get(id) ?? []) {
        if (!distanceById.has(neighborId)) {
          distanceById.set(neighborId, currentDepth + 1)
          next.push(neighborId)
        }
      }
    }
    frontier = next
  }

  const degreeById = precomputedDegreeById ?? computeDegrees(graph)
  const selectedIds = Array.from(distanceById.keys())
    .sort((a, b) => {
      const distanceDiff = distanceById.get(a) - distanceById.get(b)
      if (distanceDiff !== 0) return distanceDiff
      return (degreeById.get(b)?.degree ?? 0) - (degreeById.get(a)?.degree ?? 0)
    })
    .slice(0, nodeLimit)

  const selected = new Set(selectedIds)

  return {
    nodes: graph.nodes
      .filter((node) => selected.has(node.id))
      .map((node) => ({
        ...node,
        distance: distanceById.get(node.id),
        degree: degreeById.get(node.id)?.degree ?? 0,
      })),
    links: graph.links.filter((link) => selected.has(link.source) && selected.has(link.target)),
  }
}

export function findShortestPath(graph, sourceId, targetId, maxDepth = 6, precomputedAdjacency = null) {
  if (!graph || !sourceId || !targetId) return null
  if (sourceId === targetId) {
    const node = graph.nodeById.get(sourceId)
    return node ? { nodes: [node], links: [], hopCount: 0 } : null
  }
  if (!graph.nodeById.has(sourceId) || !graph.nodeById.has(targetId)) return null

  const adjacency = precomputedAdjacency ?? buildPathAdjacency(graph)

  const queue = [{ id: sourceId, depth: 0 }]
  const visited = new Set([sourceId])
  const previous = new Map()

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    if (current.depth >= maxDepth) continue

    for (const step of adjacency.get(current.id) ?? []) {
      if (visited.has(step.neighborId)) continue
      visited.add(step.neighborId)
      previous.set(step.neighborId, { nodeId: current.id, link: step.link })

      if (step.neighborId === targetId) {
        return reconstructPath(graph, sourceId, targetId, previous)
      }

      queue.push({ id: step.neighborId, depth: current.depth + 1 })
    }
  }

  return null
}

export function computeArtistProfile(graph, artistId) {
  const node = graph?.nodeById.get(artistId)
  if (!graph || !node || !isArtist(node)) return null

  const adjacentLinks = graph.links.filter(
    (link) => link.source === artistId || link.target === artistId,
  )
  const workIds = new Set()

  for (const link of adjacentLinks) {
    const otherId = link.source === artistId ? link.target : link.source
    const otherNode = graph.nodeById.get(otherId)
    if (otherNode && (isSong(otherNode) || isAlbum(otherNode))) workIds.add(otherId)
  }

  const works = Array.from(workIds, (id) => graph.nodeById.get(id)).filter(Boolean)
  const years = new Set(works.map((work) => work.releaseYear).filter(Boolean))
  const genres = new Set(
    works.map((work) => work.genre).filter((genre) => genre && genre !== 'Unknown'),
  )

  return {
    node,
    workIds,
    workCount: works.length,
    oceanusWorkCount: works.filter((work) => work.genre === 'Oceanus Folk').length,
    genreCount: genres.size,
    creativeRoleLinks: adjacentLinks.filter(isCreativeRoleLink).length,
    performanceLinks: adjacentLinks.filter(isPerformanceLink).length,
    membershipLinks: adjacentLinks.filter(
      (link) => relationshipCategory(link) === 'membership',
    ).length,
    influenceLinks: adjacentLinks.filter(isInfluenceLink).length,
    activeYearCount: years.size,
    firstYear: years.size ? Math.min(...years) : null,
    lastYear: years.size ? Math.max(...years) : null,
    degree: adjacentLinks.length,
  }
}

export function findArtistComparators(graph, artistId, limit = 5) {
  const focusProfile = computeArtistProfile(graph, artistId)
  if (!focusProfile) return []

  const candidateIds = new Set()
  for (const link of graph.links) {
    if (focusProfile.workIds.has(link.source)) {
      const candidate = graph.nodeById.get(link.target)
      if (candidate && isArtist(candidate) && candidate.id !== artistId) {
        candidateIds.add(candidate.id)
      }
    }
    if (focusProfile.workIds.has(link.target)) {
      const candidate = graph.nodeById.get(link.source)
      if (candidate && isArtist(candidate) && candidate.id !== artistId) {
        candidateIds.add(candidate.id)
      }
    }
  }

  return Array.from(candidateIds)
    .map((candidateId) => {
      const profile = computeArtistProfile(graph, candidateId)
      const sharedWorks = Array.from(profile.workIds).filter((id) =>
        focusProfile.workIds.has(id),
      ).length
      return {
        ...profile,
        sharedWorks,
        relevance: sharedWorks * 100 + profile.oceanusWorkCount * 5 + profile.degree,
      }
    })
    .filter((profile) => profile.sharedWorks > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        b.sharedWorks - a.sharedWorks ||
        a.node.label.localeCompare(b.node.label),
    )
    .slice(0, limit)
}

function reconstructPath(graph, sourceId, targetId, previous) {
  const nodeIds = [targetId]
  const links = []
  let currentId = targetId

  while (currentId !== sourceId) {
    const step = previous.get(currentId)
    if (!step) return null
    links.unshift(step.link)
    currentId = step.nodeId
    nodeIds.unshift(currentId)
  }

  return {
    nodes: nodeIds.map((id) => graph.nodeById.get(id)).filter(Boolean),
    links,
    hopCount: links.length,
  }
}

function buildAdjacency(graph) {
  const adjacency = new Map(graph.nodes.map((node) => [node.id, new Set()]))

  for (const link of graph.links) {
    adjacency.get(link.source)?.add(link.target)
    adjacency.get(link.target)?.add(link.source)
  }

  return adjacency
}

function buildPathAdjacency(graph) {
  const adjacency = new Map(graph.nodes.map((node) => [node.id, []]))

  for (const link of graph.links) {
    adjacency.get(link.source)?.push({ neighborId: link.target, link })
    adjacency.get(link.target)?.push({ neighborId: link.source, link })
  }

  return adjacency
}

function computeMedianDegree(degreeById) {
  const values = Array.from(degreeById.values(), (row) => row.degree).sort((a, b) => a - b)
  if (!values.length) return 0
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2
}

function d3MaximumDegree(degreeById) {
  let maximum = 0
  for (const row of degreeById.values()) maximum = Math.max(maximum, row.degree)
  return maximum
}

function getTimelineRow(byYear, year) {
  if (!byYear.has(year)) {
    byYear.set(year, {
      year,
      nodes: 0,
      links: 0,
      artists: 0,
      songs: 0,
      albums: 0,
      oceanusWorks: 0,
      sailorCreditedOceanusWorks: 0,
      creativeRoles: 0,
      performances: 0,
      influences: 0,
    })
  }

  return byYear.get(year)
}




