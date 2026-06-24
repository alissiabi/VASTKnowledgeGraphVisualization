# Interaction Model

This document describes how the dashboard views stay coordinated.

## Shared State

The main shared state lives in `Dashboard.vue`, because the dashboard is a coordinated home view rather than a set of independent pages.

| State | Meaning | Main consumers |
| --- | --- | --- |
| `filters` | Node, relationship, metadata, genre, year, and pattern filters | summaries, charts, edge overview, node-link diagram |
| `selectedNode` | Current analytical focus | entity detail, node-link highlight, ego network, path tool, comparison |
| `selectedLink` | Current observed relationship | relationship detail, evidence table, ego network |
| `networkSettings` | Ego depth, relationship focus, and node limit | ego network and evidence scope |
| `pathTarget` | Destination entity for path discovery | path explorer and graph highlighting |

## Filter Behaviour

Global filters define the visible graph subset used by summaries, distributions, relationship patterns, and the induced node-link diagram. The edge overview can update source type, relationship type, and target type together, so the analyst can move from a flow pattern to a concrete filtered subgraph.

Temporal filtering is based on release years available on songs and albums. Related people, groups, and labels are preserved when they provide context for dated works.

## Selection Behaviour

Selecting a node changes the analytical focus. Selecting a link opens the observed relationship record. Selecting a relationship pattern updates the current graph subset. Path mode keeps the current focus as the source and lets the analyst choose a destination through search or graph interaction.

## Graph View Roles

| View | Data scope | Analytical role |
| --- | --- | --- |
| Edge Overview | Relationship aggregates under the current context | Read relationship volume and choose a pattern |
| Node-link Diagram | Induced graph under active filters | Inspect filtered topology and choose an entity |
| Ego Network | Original graph neighborhood around the selected entity | Inspect local context and relationship direction |

This separation lets the analyst filter broadly while still reading the selected entity in its original neighborhood.

## Evidence Flow

The workflow is designed to move from pattern to record:

1. a filter or aggregate view suggests an interesting relationship pattern;
2. the node-link diagram shows the filtered topology;
3. the ego network gives local context around a selected entity;
4. relationship details and evidence tables expose the underlying records;
5. audit signals highlight records that deserve closer reading.

## Interaction Safeguards

Navigation in graph views is explicit. Zoom and pan are disabled by default to avoid accidental touchpad movement during analysis. Reset controls change only the viewport, preserving filters and selections.
