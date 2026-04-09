<script setup>
const cards = [
  {
    title: 'Node-link diagram',
    subtitle: 'Graph Visualization',
    content: 'Placeholder for a node-link diagram visualization of the knowledge graph.',
  },
  {
    title: 'Sankey Diagram',
    subtitle: 'Graph Visualization',
    content: 'Placeholder for a Sankey diagram visualization of the knowledge graph focused on types.',
  },
  {
    title: 'Connected components',
    subtitle: 'View for community discovery/connected componetns',
    content: 'High-level overview of the connected components in the knowledge graph, showing the number of nodes and edges in each component.',
  },
  {
    title: 'Ego Network',
    subtitle: 'Neighborhood exploration from a node',
    content: 'Placeholder for an ego network visualization that allows users to explore the neighborhood of a specific node in the knowledge graph.',
  },
  {
    title: 'Spatial/Geographic view (?)',
    subtitle: 'Geographical projection of data',
    content: 'Placeholder for a spatial or geographic view that projects the knowledge graph data onto a map, showing the geographical distribution of entities and relationships.',
  },
  {
    title: 'Temporal view (?)',
    subtitle: 'Temporal projection of data',
    content: 'Placeholder for a temporal view that shows the evolution of the knowledge graph over time, allowing users to see how entities and relationships have changed or developed.',
  }


]
</script>

<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <article
      v-for="card in cards"
      :key="card.title"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ card.subtitle }}</p>
      <h3 class="mt-1 text-base font-semibold text-slate-900">{{ card.title }}</h3>
      <div class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        {{ card.content }}
      </div>
    </article>
  </section>
</template>
