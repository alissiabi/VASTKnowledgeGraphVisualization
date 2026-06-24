# Frontend Notes

The frontend is a Vue 3 single-page application built with Vite. It loads the official MC1 graph from `public/data/MC1_graph.json`, normalizes it in the browser, computes summaries, and renders coordinated Vue/D3 views.

## Source Structure

```text
src/
+-- assets/main.css                # Tailwind entry and dashboard design utilities
+-- data/
¦   +-- graphLoader.js             # loads the MC1 graph from public/data
¦   +-- graphTransforms.js         # normalizes nodes, links, labels, years, and raw properties
¦   +-- metrics.js                 # summaries, patterns, paths, profiles, audits
¦   +-- relationshipSemantics.js   # relationship families, labels, and line styles
¦   +-- visualEncodings.js         # shared colors and encoding helpers
+-- components/
¦   +-- Dashboard.vue              # main shared state and dashboard composition
¦   +-- RelationshipPatternExplorer.vue
¦   +-- NodeLinkDiagram.vue
¦   +-- EgoNetwork.vue
¦   +-- EvidenceTable.vue
¦   +-- QualityExplorer.vue
¦   +-- support/detail/filter/chart components
+-- views/
¦   +-- HomeView.vue
¦   +-- AboutView.vue
+-- router/index.js
```

## Data Flow

1. `graphLoader.js` fetches the graph JSON.
2. `graphTransforms.js` normalizes identifiers, labels, node types, link types, release years, and raw properties.
3. `metrics.js` builds graph indexes and derived summaries.
4. `Dashboard.vue` owns filters, selected entity, selected relationship, path state, and network settings.
5. Components receive data through props and emit explicit events back to the dashboard.

## Performance Choices

The graph is loaded once and indexed for interaction. Degree maps, adjacency lists, path adjacency, and relationship patterns are reused across views. Support views are scheduled after the main dashboard data is ready, so the primary exploration path becomes available first.

The node-link diagram and ego network expose explicit bounds for node count and graph depth. These controls keep the graph readable and make the displayed subset transparent.

## Design System

`assets/main.css` defines the shared visual vocabulary: page width, top bar, cards, controls, buttons, KPI cards, chart buttons, workspace grids, support grids, detail boxes, and warning notes. The visual style is intentionally compact, restrained, and task-oriented.

## Conventions

- Keep graph semantics in `src/data/` rather than inside visual components.
- Use `visualEncodings.js` for entity colors.
- Use `relationshipSemantics.js` for relationship grouping and line styles.
- Keep shared dashboard state in `Dashboard.vue` for the coordinated home view.
- Use props and events between dashboard and panels.
- Preserve original MC1 properties and label derived values as derived values.
