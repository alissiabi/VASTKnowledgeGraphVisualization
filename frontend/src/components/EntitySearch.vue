<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  selectedId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

const query = ref('')
const isOpen = ref(false)

const results = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle.length < 2) return []

  return props.nodes
    .filter((node) => node.label.toLowerCase().includes(needle))
    .sort((a, b) => {
      const aExact = a.label.toLowerCase() === needle
      const bExact = b.label.toLowerCase() === needle
      if (aExact !== bExact) return aExact ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .slice(0, 8)
})

function selectResult(node) {
  query.value = node.label
  isOpen.value = false
  emit('select', node)
}
</script>

<template>
  <section class="va-card va-card-pad">
    <div class="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
      <div>
        <h2 class="va-panel-title">Find an entity</h2>
        <p class="va-panel-copy mt-1">
          Search the complete MC1 graph and use a result as the network focus.
        </p>
      </div>

      <div class="relative">
        <label for="entity-search" class="text-sm font-medium text-slate-700">
          Artist, work, group, or label
        </label>
        <input
          id="entity-search"
          v-model="query"
          type="search"
          class="va-control mt-1"
          placeholder="Search by name"
          autocomplete="off"
          @focus="isOpen = true"
          @input="isOpen = true"
          @keydown.escape="isOpen = false"
        />

        <div
          v-if="isOpen && query.trim().length >= 2"
          class="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded border border-slate-300 bg-white shadow-lg"
        >
          <button
            v-for="node in results"
            :key="node.id"
            type="button"
            class="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-blue-50"
            :class="{ 'bg-blue-50': node.id === selectedId }"
            @mousedown.prevent="selectResult(node)"
          >
            <span class="truncate font-medium text-slate-900">{{ node.label }}</span>
            <span class="shrink-0 text-xs text-slate-500">{{ node.nodeType }}</span>
          </button>
          <p v-if="!results.length" class="px-3 py-3 text-sm text-slate-500">
            No matching entity.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
