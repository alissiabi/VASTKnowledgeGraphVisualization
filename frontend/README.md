# Visual Analytics Frontend

Vue 3 and D3 prototype for the VAST 2025 Design Challenge. The official MC1 knowledge graph is
used as a case study for linked filtering, local topology exploration, temporal analysis, path
discovery, comparison, and source-record verification.

## Setup

Requirements:

- Node.js 20.19 or newer compatible version;
- npm.

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

## Validation

```powershell
npm test
npm run lint
npm run build
npm audit
```

## Structure

- `src/components/Dashboard.vue`: analytical state and linked-view coordination;
- `src/components/RelationshipPatternExplorer.vue`: source type -> relationship type -> target type overview;
- `src/components/NodeLinkDiagram.vue`: filtered induced graph for topology inspection;
- `src/components/EgoNetwork.vue`: directed radial network with zoom, pan, and evidence selection;
- `src/components/EvidenceTable.vue`: observed relationship records for verification;
- `src/data/graphTransforms.js`: lossless normalization of the official graph;
- `src/data/relationshipSemantics.js`: shared MC1 relationship taxonomy;
- `src/data/metrics.js`: transparent derived summaries and graph traversal;
- `tests/`: focused tests for relationship semantics, metrics, and path direction;
- `public/data/MC1_graph.json`: browser-served copy of the official dataset.

The frontend loads the graph directly. A backend is optional and should be introduced only if
larger datasets make browser-side filtering or traversal impractical.
