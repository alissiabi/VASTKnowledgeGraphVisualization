# Design Brief

## Project Frame

This project proposes a visual analytics workflow for exploring the VAST 2025 MC1 music knowledge graph. The work is framed by the VAST Challenge 2025 Design Challenge and developed as a Vue/D3 prototype for the Visual Analytics course.

The prototype uses MC1 as a concrete graph case study: a directed network of people, songs, albums, record labels, musical groups, and typed music relationships. The design goal is to make this graph explorable through coordinated visual views rather than through raw records or isolated charts.

## Target User

The intended user is a music-domain analyst, journalist, or investigator who understands the domain but may not be trained in graph visualization. The interface should help this user reason about entities, relationships, temporal context, and evidence without requiring manual graph queries.

## Analytical Goals

The dashboard supports three main goals:

- discover relationship patterns between entity types and relationship types;
- move from global structure to the local context of a selected entity;
- verify visual impressions through inspectable relationship records.

## Core Workflow

The interface follows a progressive workflow:

1. Global summaries and filters establish the current graph subset.
2. The edge overview exposes source type, relationship type, and target type volumes.
3. The node-link diagram shows the filtered induced subgraph and supports entity selection.
4. The ego network shows the selected entity in its original graph neighborhood.
5. Detail, path, timeline, comparison, and evidence views support interpretation and verification.

## Visual Rationale

The layout is compact and analytical. Cards separate functional views, but the visual hierarchy keeps graph structure and evidence inspection central. The design uses stable entity-type colors across graph views, blue for active focus, line style for relationship families, arrowheads for source-to-target direction, and aligned bar length for rankings and distributions.

The complete graph is represented through summaries, filters, and bounded graph views. This keeps the exploration readable while preserving access to observed records and derived summaries.

## Evidence Principle

The dashboard separates observed MC1 records from values computed by the prototype. Node and link details come from the dataset. Counts, paths, rankings, chronology checks, duplicate groups, and comparison profiles are derived from those records and used as analytical aids.

## Reading Limits

The ego network is a local neighborhood around the selected entity. Temporal analysis relies mainly on release years available for songs and albums. Artist comparison and graph proximity describe association within the graph, not quality, future success, or causal influence.
