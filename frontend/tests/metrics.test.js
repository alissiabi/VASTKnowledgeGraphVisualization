import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeGraph } from '../src/data/graphTransforms.js'
import {
  buildNodeLinkSubgraph,
  computeArtistProfile,
  computeConnectedComponents,
  computeDegreeDistribution,
  computeOverview,
  computeQualitySignals,
  computeRelationshipPatterns,
  findShortestPath,
} from '../src/data/metrics.js'

const graph = normalizeGraph({
  directed: true,
  multigraph: true,
  nodes: [
    { id: 'artist', name: 'Artist A', 'Node Type': 'Person' },
    { id: 'song', name: 'Song A', 'Node Type': 'Song', genre: 'Oceanus Folk' },
    { id: 'group', name: 'Group A', 'Node Type': 'MusicalGroup' },
  ],
  links: [
    { source: 'artist', target: 'song', 'Edge Type': 'ComposerOf' },
    { source: 'artist', target: 'song', 'Edge Type': 'PerformerOf', key: 1 },
    { source: 'artist', target: 'group', 'Edge Type': 'MemberOf' },
    { source: 'song', target: 'group', 'Edge Type': 'InStyleOf' },
  ],
})

test('overview reports relationship families as separate transparent counts', () => {
  const overview = computeOverview(graph)
  assert.equal(overview.creativeRoleLinks, 1)
  assert.equal(overview.performanceLinks, 1)
  assert.equal(overview.membershipLinks, 1)
  assert.equal(overview.influenceLinks, 1)
  assert.equal(overview.maximumDegree, 3)
  assert.equal(overview.medianDegree, 3)
})

test('degree distribution uses explicit power-of-two bins', () => {
  const degreeById = new Map([
    ['a', { degree: 0 }],
    ['b', { degree: 1 }],
    ['c', { degree: 3 }],
    ['d', { degree: 64 }],
  ])
  const rows = computeDegreeDistribution(degreeById)
  assert.equal(rows.find((row) => row.label === '0').value, 1)
  assert.equal(rows.find((row) => row.label === '2-3').value, 1)
  assert.equal(rows.find((row) => row.label === '64+').value, 1)
})




test('connected components summarize disconnected regions without using edge direction', () => {
  const disconnectedGraph = normalizeGraph({
    directed: true,
    nodes: [
      { id: 'a', name: 'A', 'Node Type': 'Person' },
      { id: 'b', name: 'B', 'Node Type': 'Song' },
      { id: 'c', name: 'C', 'Node Type': 'Album' },
      { id: 'd', name: 'D', 'Node Type': 'Person' },
    ],
    links: [{ source: 'a', target: 'b', 'Edge Type': 'PerformerOf' }],
  })

  const components = computeConnectedComponents(disconnectedGraph)
  assert.equal(components.total, 3)
  assert.equal(components.isolatedCount, 2)
  assert.equal(components.largest.nodeCount, 2)
  assert.equal(components.largest.linkCount, 1)
})
test('relationship patterns preserve relationship semantics between endpoint types', () => {
  const patterns = computeRelationshipPatterns(graph).patterns
  const composerPattern = patterns.find(
    (pattern) =>
      pattern.sourceType === 'Person' &&
      pattern.edgeType === 'ComposerOf' &&
      pattern.targetType === 'Song',
  )
  const performerPattern = patterns.find(
    (pattern) =>
      pattern.sourceType === 'Person' &&
      pattern.edgeType === 'PerformerOf' &&
      pattern.targetType === 'Song',
  )

  assert.equal(composerPattern.value, 1)
  assert.equal(performerPattern.value, 1)
  assert.equal(patterns[0].value, 1)
  assert.equal(patterns.length, 4)
})
test('quality signals separate chronology, missing years, and duplicate records', () => {
  const qualityGraph = normalizeGraph({
    directed: true,
    nodes: [
      { id: 'older', name: 'Older', 'Node Type': 'Song', release_date: '2000' },
      { id: 'newer', name: 'Newer', 'Node Type': 'Song', release_date: '2005' },
      { id: 'unknown', name: 'Unknown Date', 'Node Type': 'Song' },
    ],
    links: [
      { source: 'older', target: 'newer', 'Edge Type': 'CoverOf' },
      { source: 'newer', target: 'unknown', 'Edge Type': 'InStyleOf' },
      { source: 'newer', target: 'older', 'Edge Type': 'ComposerOf' },
      { source: 'newer', target: 'older', 'Edge Type': 'ComposerOf', key: 1 },
    ],
  })
  const signals = computeQualitySignals(qualityGraph)
  assert.equal(signals.chronology.count, 1)
  assert.equal(signals.missingYears.count, 1)
  assert.equal(signals.duplicates.count, 1)
})

test('artist profile does not count performance as creative collaboration', () => {
  const profile = computeArtistProfile(graph, 'artist')
  assert.equal(profile.creativeRoleLinks, 1)
  assert.equal(profile.performanceLinks, 1)
  assert.equal(profile.membershipLinks, 1)
})

test('shortest path traverses for discovery but preserves observed direction', () => {
  const path = findShortestPath(graph, 'group', 'artist')
  assert.equal(path.hopCount, 1)
  assert.equal(path.links[0].source, 'artist')
  assert.equal(path.links[0].target, 'group')
})



test('node-link subgraph limits matching nodes by degree and keeps induced links', () => {
  const subgraph = buildNodeLinkSubgraph(graph, 2)
  assert.equal(subgraph.totalNodes, 3)
  assert.equal(subgraph.totalLinks, 4)
  assert.equal(subgraph.nodeLimit, 2)
  assert.deepEqual(
    subgraph.nodes.map((node) => node.id).sort(),
    ['artist', 'song'],
  )
  assert.equal(subgraph.links.length, 2)
})