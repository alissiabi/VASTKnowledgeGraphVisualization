<script setup>
defineProps({
  overview: {
    type: Object,
    required: true,
  },
  fullOverview: {
    type: Object,
    required: true,
  },
})

const cards = [
  { key: 'totalNodes', label: 'Entities', description: 'Graph nodes' },
  { key: 'totalLinks', label: 'Relationships', description: 'Directed graph links' },
  { key: 'artistCount', label: 'Artists', description: 'Person-type nodes' },
  { key: 'songCount', label: 'Songs', description: 'Song-type nodes' },
]
</script>

<template>
  <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <article
      v-for="card in cards"
      :key="card.key"
      class="va-kpi-card"
    >
      <p class="text-xs font-semibold text-slate-600">{{ card.label }}</p>
      <p class="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
        {{ overview[card.key].toLocaleString() }}
      </p>
      <p class="mt-1 text-xs tabular-nums text-slate-500">
        {{ card.description }}
        <template v-if="overview[card.key] !== fullOverview[card.key]">
          / {{ fullOverview[card.key].toLocaleString() }} in full dataset
        </template>
      </p>
    </article>
  </section>
</template>
