<template>
  <section class="space-y-5">
    <header class="va-card va-card-pad">
      <p class="va-brand-kicker">About and Method</p>
      <h1 class="mt-1 text-2xl font-semibold text-slate-950">Project Overview</h1>
      <p class="mt-3 w-full text-sm leading-6 text-slate-600">
        This project is framed by the VAST 2025 Design Challenge. The dashboard helps analysts
        explore the MC1 music knowledge graph through a coordinated workflow: edge overview,
        filtered node-link inspection, ego-network analysis, temporal context, relationship paths,
        and evidence records. The goal is to support traceable interpretation rather than provide a
        single automatic answer.
      </p>
    </header>

    <div class="grid items-stretch gap-5 lg:grid-cols-2">
      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Dataset</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The dataset is the official VAST 2025 MC1 music knowledge graph. It contains directed
          links between people, songs, albums, labels, and groups, so each relationship preserves a
          recorded source and target. This direction is important for reading roles, influence,
          references, and membership correctly.
        </p>
      </article>

      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Supported Analysis</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The prototype supports graph-based analysis through relationship-pattern filtering, induced
          subgraph inspection, local ego-network exploration, node and link detail inspection,
          temporal exploration of Oceanus Folk, path discovery, artist comparison, and verification
          of selected or anomalous records. It is designed to make the MC1 graph readable for
          analysts who understand the domain but may not be graph-visualization specialists.
        </p>
      </article>

      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Encoding Choices</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The encoding strategy is organized around structure, comparison, and evidence. The edge
          overview summarizes source type, relationship type, target type, and count. The node-link
          diagram shows the filtered induced subgraph, while the ego network uses graph distance,
          node connectivity, entity-type color, and relationship line style to make local structure
          readable. Direction is preserved with arrowheads. Rankings use bar length, while the
          temporal view separates overall Oceanus Folk activity from Sailor Shift-related works.
          Blue marks the active focus, orange marks the Sailor Shift time series, rose marks genre
          ranking, and slate is reserved for neutral context.
        </p>
      </article>

      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Linked Interaction Workflow</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The interaction model follows the overview-to-detail workflow developed for this prototype. The
          user can filter relationship patterns in the edge overview, inspect the induced node-link
          diagram, and select an entity for ego-network analysis in its original graph context. From
          there, paths, relationship records, and audit signals help verify how entities are
          connected and whether the visible evidence supports the emerging interpretation. Artist
          comparison adds a guided comparison step for connected performers, while all views remain
          coordinated with the current subset of the graph.
        </p>
      </article>

      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Evidence Traceability</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The dashboard separates original MC1 evidence from values computed by the prototype. Node
          and relationship details come from the dataset, while counts, rankings, paths, chronology
          checks, duplicate groups, and artist profiles are calculated from those records. Each
          audit signal can be traced back to the relationship that generated it, so derived results
          support interpretation without being presented as new dataset facts.
        </p>
      </article>

      <article class="va-card va-card-pad">
        <h2 class="text-base font-semibold text-slate-950">Limitations</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The prototype favors focused exploration rather than displaying the complete graph at
          once, so the ego network should be read as a local neighborhood around the selected
          entity. Temporal analysis is based mainly on song and album release years, while MC1
          relationship records generally do not provide dates for the relationships themselves.
          Artist comparison and graph proximity describe association, not quality, future success,
          or causal influence.
        </p>
      </article>
    </div>

    <footer class="va-card va-card-pad">
      <h2 class="text-base font-semibold text-slate-950">References</h2>
      <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a
          class="font-medium text-blue-800 hover:underline"
          href="https://vast-challenge.github.io/2025/DC.html"
          target="_blank"
          rel="noreferrer"
        >
          VAST 2025 Design Challenge
        </a>
        <a
          class="font-medium text-blue-800 hover:underline"
          href="https://vast-challenge.github.io/2025/MC1.html"
          target="_blank"
          rel="noreferrer"
        >
          MC1 dataset and scenario
        </a>
      </div>
    </footer>
  </section>
</template>



