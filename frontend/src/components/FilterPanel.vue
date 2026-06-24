<script setup>
import { computed } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  nodeTypes: {
    type: Array,
    required: true,
  },
  edgeTypes: {
    type: Array,
    required: true,
  },
  genres: {
    type: Array,
    required: true,
  },
  years: {
    type: Array,
    required: true,
  },
  propertyOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:filters', 'reset'])

const activeFilters = computed(() => {
  const rows = []
  if (props.filters.nodeType) rows.push(`Entity: ${props.filters.nodeType}`)
  if (props.filters.edgeType) rows.push(`Relationship: ${props.filters.edgeType}`)
  if (props.filters.sourceNodeType || props.filters.targetNodeType) {
    rows.push(
      `Direction: ${props.filters.sourceNodeType || 'Any source'} -> ${props.filters.targetNodeType || 'Any target'}`,
    )
  }
  if (props.filters.genre) rows.push(`Genre: ${props.filters.genre}`)
  if (props.filters.nodeProperty && props.filters.propertyValue) {
    rows.push(`${props.filters.nodeProperty}: ${props.filters.propertyValue}`)
  }
  if (props.filters.startYear || props.filters.endYear) {
    rows.push(
      `Years: ${props.filters.startYear || props.years[0]}-${props.filters.endYear || props.years.at(-1)}`,
    )
  }
  return rows
})

function updateFilter(key, value) {
  const nextFilters = {
    ...props.filters,
    [key]: value,
  }

  if (
    key === 'startYear' &&
    value &&
    nextFilters.endYear &&
    Number(value) > Number(nextFilters.endYear)
  ) {
    nextFilters.endYear = value
  }

  if (
    key === 'endYear' &&
    value &&
    nextFilters.startYear &&
    Number(value) < Number(nextFilters.startYear)
  ) {
    nextFilters.startYear = value
  }

  emit('update:filters', nextFilters)
}

const selectedProperty = computed(() =>
  props.propertyOptions.find((property) => property.key === props.filters.nodeProperty),
)
const metadataRule = computed(() => {
  if (!selectedProperty.value) {
    return 'Optional: choose an entity attribute, then choose the value those entities must match.'
  }
  if (!props.filters.propertyValue) {
    return `Attribute selected: ${selectedProperty.value.label}. Choose a value to activate the filter.`
  }
  return `Active rule: keep entities where ${selectedProperty.value.label} equals ${props.filters.propertyValue}; directly connected entities remain as context.`
})

function updateProperty(key) {
  emit('update:filters', {
    ...props.filters,
    nodeProperty: key,
    propertyValue: '',
  })
}
</script>

<template>
  <section class="va-card va-card-pad">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="va-panel-title">Global Filters</h2>
        <p class="va-panel-copy mt-1">
          Entity, relationship, direction, genre, and release-year scope.
        </p>
      </div>
      <button
        type="button"
        class="va-button"
        @click="emit('reset')"
      >
        Reset filters
      </button>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          Entity type
          <InfoTooltip text="Limits the dashboard to people, songs, albums, groups, or labels." />
        </span>
        <select
          class="va-control"
          :value="filters.nodeType"
          @change="updateFilter('nodeType', $event.target.value)"
        >
          <option value="">All entity types</option>
          <option v-for="row in nodeTypes" :key="row.label" :value="row.label">
            {{ row.label }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          Filter by attribute
          <InfoTooltip
            text="Choose an attribute found in the original entity records, such as country or gender. Available fields are derived from the dataset."
          />
        </span>
        <select
          class="va-control"
          :value="filters.nodeProperty"
          @change="updateProperty($event.target.value)"
        >
          <option value="">Do not filter by attribute</option>
          <option v-for="property in propertyOptions" :key="property.key" :value="property.key">
            {{ property.label }}
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          Required value
          <InfoTooltip
            text="Choose the value that entities must have for the selected metadata field."
          />
        </span>
        <select
          class="va-control"
          :disabled="!selectedProperty"
          :value="filters.propertyValue"
          @change="updateFilter('propertyValue', $event.target.value)"
        >
          <option value="">All values</option>
          <option v-for="value in selectedProperty?.values ?? []" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          Relationship type
          <InfoTooltip
            text="Limits the graph to one recorded link meaning, such as performer, composer, member, sample, or cover."
          />
        </span>
        <select
          class="va-control"
          :value="filters.edgeType"
          @change="updateFilter('edgeType', $event.target.value)"
        >
          <option value="">All relationship types</option>
          <option v-for="row in edgeTypes" :key="row.label" :value="row.label">
            {{ row.label }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          Genre
          <InfoTooltip
            text="Keeps works with the selected known genre and preserves their directly connected entities as context."
          />
        </span>
        <select
          class="va-control"
          :value="filters.genre"
          @change="updateFilter('genre', $event.target.value)"
        >
          <option value="">All known genres</option>
          <option v-for="row in genres" :key="row.label" :value="row.label">
            {{ row.label }} ({{ row.value.toLocaleString() }})
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          From release year
          <InfoTooltip text="Start of the release interval applied to dated songs and albums." />
        </span>
        <select
          class="va-control"
          :value="filters.startYear"
          @change="updateFilter('startYear', $event.target.value)"
        >
          <option value="">First available year</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <label class="space-y-1 text-sm">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          To release year
          <InfoTooltip text="End of the release interval applied to dated songs and albums." />
        </span>
        <select
          class="va-control"
          :value="filters.endYear"
          @change="updateFilter('endYear', $event.target.value)"
        >
          <option value="">Last available year</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>
    </div>

    <p class="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
      {{ metadataRule }}
    </p>

    <div v-if="activeFilters.length" class="mt-3 flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-slate-600">Active filters</span>
      <span
        v-for="filter in activeFilters"
        :key="filter"
        class="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-900"
      >
        {{ filter }}
      </span>
    </div>

    <p class="mt-3 text-xs leading-5 text-slate-500">
      Release-year scope applies to songs and albums; directly connected artists, groups, and
      labels remain as relational context. Attribute filters use fields present in the original
      entity records. Directional type filters are applied through the
      relationship pattern explorer below.
    </p>
  </section>
</template>

