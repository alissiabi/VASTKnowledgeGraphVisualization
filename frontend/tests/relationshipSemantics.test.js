import test from 'node:test'
import assert from 'node:assert/strict'

import {
  relationshipCategory,
  relationshipDash,
  relationshipMatchesCategory,
} from '../src/data/relationshipSemantics.js'

const link = (edgeType) => ({ edgeType, edgeTypeKey: edgeType.toLowerCase() })

test('classifies MC1 families without conflating creative and performance roles', () => {
  assert.equal(relationshipCategory(link('ComposerOf')), 'creative')
  assert.equal(relationshipCategory(link('PerformerOf')), 'performance')
  assert.equal(relationshipCategory(link('RecordedBy')), 'performance')
  assert.equal(relationshipCategory(link('MemberOf')), 'membership')
  assert.equal(relationshipCategory(link('DistributedBy')), 'distribution')
  assert.equal(relationshipCategory(link('DirectlySamples')), 'influence')
})

test('uses the shared category for filtering and line style', () => {
  const sample = link('LyricalReferenceTo')
  assert.equal(relationshipMatchesCategory(sample, 'influence'), true)
  assert.equal(relationshipMatchesCategory(sample, 'creative'), false)
  assert.equal(relationshipMatchesCategory(sample, 'all'), true)
  assert.equal(relationshipDash(sample), '5 5')
})
