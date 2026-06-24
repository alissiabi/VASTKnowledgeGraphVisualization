# View Catalogue

This catalogue documents the dashboard views and the role of each card.

| View | Component | Role |
| --- | --- | --- |
| Entity Search | `EntitySearch.vue` | Move directly to a known entity in the MC1 graph. |
| Filter Panel | `FilterPanel.vue` | Edit graph filters by type, relationship, metadata, genre, and year. |
| Summary Cards | `SummaryCards.vue` | Show current graph size and high-level counts. |
| Filter Impact | `FilterImpact.vue` | Show how much of the full graph remains visible. |
| Current Analysis | `CurrentAnalysis.vue` | Summarize the current analytical reading from visible data. |
| Edge Overview | `RelationshipPatternExplorer.vue` | Show source type to relationship type to target type volumes and support pattern filtering. |
| Node-link Diagram | `NodeLinkDiagram.vue` | Show the induced filtered subgraph and support ego selection. |
| Ego Network | `EgoNetwork.vue` | Show local context around the selected entity from the original graph. |
| Entity Detail | `EntityDetail.vue` | Show selected node identity and available metadata. |
| Relationship Detail | `RelationshipDetail.vue` | Show selected link source, target, direction, type, and properties. |
| Connection Path | `PathExplorer.vue` | Discover a path between the current focus and another entity. |
| Timeline | `TimelineChart.vue` | Show Oceanus Folk works over release years and Sailor Shift-related activity. |
| Top Known Genres | `CategoricalBarChart.vue` | Rank known genres among visible musical works. |
| Relationships per Entity | `DegreeDistribution.vue` | Explain graph skew and connectivity distribution. |
| Connected Components | `ConnectedComponents.vue` | Summarize graph fragmentation and isolated structures. |
| Data Quality Signals | Dashboard inline view | Summarize metadata coverage and relationship-family counts. |
| Observed Relationship Records | `EvidenceTable.vue` | Inspect records visible in the focused relationship context. |
| Evidence Audit | `QualityExplorer.vue` | Review chronology, missing temporal context, and duplicate-link signals. |
| Artist Comparison | `ArtistComparison.vue` | Compare the focus artist with a connected artist using transparent counts. |

## Reading Order

The intended reading order is:

1. summaries and filters;
2. edge overview;
3. node-link diagram;
4. ego network;
5. entity and relationship details;
6. path, timeline, comparison, and evidence views.

This order supports progressive analysis: overview, filter, inspect, focus, verify.
