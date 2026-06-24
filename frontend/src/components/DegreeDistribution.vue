<script setup>
import * as d3 from 'd3'
import { computed } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  median: {
    type: Number,
    required: true,
  },
  maximum: {
    type: Number,
    required: true,
  },
  focusDegree: {
    type: Number,
    default: null,
  },
  topEntities: {
    type: Array,
    default: () => [],
  },
  focusId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

const width = 720
const height = 300
const margin = { top: 16, right: 18, bottom: 44, left: 54 }

const xScale = computed(() =>
  d3
    .scaleBand()
    .domain(props.rows.map((row) => row.label))
    .range([margin.left, width - margin.right])
    .padding(0.18),
)

const yScale = computed(() =>
  d3
    .scaleLinear()
    .domain([0, d3.max(props.rows, (row) => row.value) ?? 1])
    .nice()
    .range([height - margin.bottom, margin.top]),
)

const yTicks = computed(() => yScale.value.ticks(4))
const focusBin = computed(
  () =>
    props.rows.find(
      (row) =>
        props.focusDegree !== null &&
        props.focusDegree >= row.min &&
        (row.max === null || props.focusDegree <= row.max),
    ) ?? null,
)
</script>

<template>
  <article class="va-card va-card-pad flex h-full flex-col">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-1.5">
          <h2 class="va-panel-title">Relationships per Entity</h2>
          <InfoTooltip
            text="In graph analysis this is the degree distribution. Degree is the number of incoming and outgoing relationships connected to an entity."
          />
        </div>
        <p class="va-panel-copy mt-1">
          How many visible entities have few or many relationships?
        </p>
      </div>
      <dl class="flex gap-4 text-xs">
        <div>
          <dt class="text-slate-500">Median</dt>
          <dd class="font-semibold tabular-nums text-slate-900">{{ median }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Maximum</dt>
          <dd class="font-semibold tabular-nums text-slate-900">{{ maximum }}</dd>
        </div>
        <div v-if="focusDegree !== null">
          <dt class="text-slate-500">Current focus</dt>
          <dd class="font-semibold tabular-nums text-blue-800">{{ focusDegree }}</dd>
        </div>
      </dl>
    </div>

    <div class="mt-3 grid flex-1 items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_180px]">
      <svg
        class="block h-full min-h-[280px] w-full"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        aria-label="Distribution of visible entity degree"
      >
        <g v-for="tick in yTicks" :key="tick">
          <line
            :x1="margin.left"
            :x2="width - margin.right"
            :y1="yScale(tick)"
            :y2="yScale(tick)"
            stroke="#e2e8f0"
          />
          <text
            :x="margin.left - 9"
            :y="yScale(tick) + 4"
            text-anchor="end"
            class="fill-slate-500 text-xs"
          >
            {{ tick.toLocaleString() }}
          </text>
        </g>

        <g v-for="row in rows" :key="row.label">
          <rect
            :x="xScale(row.label)"
            :y="yScale(row.value)"
            :width="xScale.bandwidth()"
            :height="height - margin.bottom - yScale(row.value)"
            :fill="focusBin?.label === row.label ? '#2563eb' : '#64748b'"
            :opacity="focusBin?.label === row.label ? 0.92 : 0.78"
          >
            <title>
              Degree {{ row.label }}: {{ row.value.toLocaleString() }} visible entities
            </title>
          </rect>
          <text
            :x="(xScale(row.label) ?? 0) + xScale.bandwidth() / 2"
            :y="height - margin.bottom + 20"
            text-anchor="middle"
            class="fill-slate-500 text-xs"
          >
            {{ row.label }}
          </text>
        </g>

        <text
          :x="margin.left"
          :y="margin.top - 6"
          class="fill-slate-500 text-xs"
        >
          Visible entities
        </text>
        <text
          :x="margin.left + (width - margin.left - margin.right) / 2"
          :y="height - 7"
          text-anchor="middle"
          class="fill-slate-500 text-xs"
        >
          Number of relationships per entity
        </text>
      </svg>

      <div class="flex flex-col border-t border-slate-200 pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <h3 class="text-xs font-semibold text-slate-700">Most connected in view</h3>
        <div class="mt-2 grid flex-1 content-start gap-1.5">
          <button
            v-for="entity in topEntities.slice(0, 4)"
            :key="entity.id"
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-xs transition"
            :class="
              entity.id === focusId
                ? 'border-blue-300 bg-blue-50 text-blue-950'
                : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
            "
            @click="emit('select', entity)"
          >
            <span class="truncate">{{ entity.label }}</span>
            <span class="shrink-0 font-semibold tabular-nums">{{ entity.degree }}</span>
          </button>
        </div>
      </div>
    </div>

    <p class="mt-2 text-xs leading-5 text-slate-500">
      Power-of-two bins keep the highly skewed graph readable. Degree counts incoming and outgoing
      relationships; it describes connectivity, not importance or quality.
    </p>
  </article>
</template>
