<script setup>
import * as d3 from 'd3'
import { computed } from 'vue'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  startYear: {
    type: [String, Number],
    default: '',
  },
  endYear: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['select-year'])

const width = 1040
const height = 320
const margin = { top: 24, right: 36, bottom: 48, left: 52 }
const chartHeight = height - margin.top - margin.bottom
const chartWidth = width - margin.left - margin.right

const xScale = computed(() =>
  d3
    .scaleBand()
    .domain(props.rows.map((row) => String(row.year)))
    .range([margin.left, width - margin.right])
    .padding(0.18),
)

const yScale = computed(() => {
  const maximum =
    d3.max(props.rows, (row) =>
      Math.max(row.oceanusWorks, row.sailorCreditedOceanusWorks),
    ) ?? 1

  return d3
    .scaleLinear()
    .domain([0, maximum])
    .nice()
    .range([height - margin.bottom, margin.top])
})

const sailorLine = computed(() =>
  d3
    .line()
    .x((row) => (xScale.value(String(row.year)) ?? 0) + xScale.value.bandwidth() / 2)
    .y((row) => yScale.value(row.sailorCreditedOceanusWorks))
    .curve(d3.curveMonotoneX)(props.rows),
)

const yTicks = computed(() => yScale.value.ticks(5))
const sailorPoints = computed(() =>
  props.rows.filter((row) => row.sailorCreditedOceanusWorks > 0),
)
const peakOceanusYear = computed(() =>
  props.rows.reduce(
    (peak, row) => (!peak || row.oceanusWorks > peak.oceanusWorks ? row : peak),
    null,
  ),
)
const firstSailorYear = computed(() => sailorPoints.value[0] ?? null)
const selectedYearRow = computed(() => {
  if (!props.startYear || !props.endYear || String(props.startYear) !== String(props.endYear)) {
    return null
  }
  return props.rows.find((row) => String(row.year) === String(props.startYear)) ?? null
})
const timelineEvents = computed(() => {
  const events = []
  const firstOceanusYear = props.rows.find((row) => row.oceanusWorks > 0)
  if (firstOceanusYear) {
    events.push({ label: 'First observed Oceanus Folk work', row: firstOceanusYear, color: '#475569' })
  }
  if (peakOceanusYear.value) {
    events.push({ label: 'Peak output', row: peakOceanusYear.value, color: '#2563eb' })
  }
  if (firstSailorYear.value) {
    events.push({ label: 'First Sailor Shift credit', row: firstSailorYear.value, color: '#ea580c' })
  }
  return events.filter(
    (event, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.row.year === event.row.year && candidate.label === event.label,
      ) === index,
  )
})
const xTicks = computed(() => {
  if (!props.rows.length) return []
  const step = Math.max(1, Math.ceil(props.rows.length / 10))
  return props.rows.filter((row, index) => index % step === 0 || index === props.rows.length - 1)
})

const selectedRange = computed(() => {
  if (!props.startYear && !props.endYear) return null
  const start = String(props.startYear || props.rows[0]?.year)
  const end = String(props.endYear || props.rows.at(-1)?.year)
  const startX = xScale.value(start)
  const endX = xScale.value(end)
  if (startX === undefined || endX === undefined) return null

  return {
    x: startX,
    width: endX - startX + xScale.value.bandwidth(),
  }
})

function selectYear(year) {
  emit('select-year', year)
}
</script>

<template>
  <article class="va-card va-card-pad h-full">
    <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="va-panel-title">Oceanus Folk Over Time</h2>
        <p class="va-panel-copy mt-1">
          Oceanus Folk songs and albums by release year. The orange series counts works directly
          credited to Sailor Shift as performer, composer, producer, or lyricist.
        </p>
      </div>
      <div class="flex flex-wrap gap-3 text-xs text-slate-600">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-blue-600" />
          Oceanus Folk works
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-5 bg-orange-600" />
          Works credited to Sailor Shift
        </span>
      </div>
    </div>

    <svg
      v-if="rows.length"
      class="mt-3 block h-auto w-full"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      aria-label="Timeline of Oceanus Folk works and works credited to Sailor Shift"
    >
      <rect
        v-if="selectedRange"
        :x="selectedRange.x"
        :y="margin.top"
        :width="selectedRange.width"
        :height="chartHeight"
        fill="#dbeafe"
        opacity="0.55"
      />

      <g v-for="tick in yTicks" :key="tick">
        <line
          :x1="margin.left"
          :x2="width - margin.right"
          :y1="yScale(tick)"
          :y2="yScale(tick)"
          stroke="#e2e8f0"
        />
        <text
          :x="margin.left - 10"
          :y="yScale(tick) + 4"
          text-anchor="end"
          class="fill-slate-500 text-xs"
        >
          {{ tick }}
        </text>
      </g>

      <g
        v-for="row in rows"
        :key="row.year"
        class="cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="`${row.year}: ${row.oceanusWorks} Oceanus Folk works, ${row.sailorCreditedOceanusWorks} credited to Sailor Shift`"
        @click="selectYear(row.year)"
        @keydown.enter="selectYear(row.year)"
        @keydown.space.prevent="selectYear(row.year)"
      >
        <rect
          :x="xScale(String(row.year))"
          :y="yScale(row.oceanusWorks)"
          :width="xScale.bandwidth()"
          :height="height - margin.bottom - yScale(row.oceanusWorks)"
          fill="#2563eb"
          :opacity="
            startYear || endYear
              ? Number(row.year) >= Number(startYear || rows[0].year) &&
                  Number(row.year) <= Number(endYear || rows.at(-1).year)
                ? 0.88
                : 0.28
              : 0.78
          "
        >
          <title>
            {{ row.year }} | Oceanus Folk works: {{ row.oceanusWorks }} | Works credited to Sailor
            Shift: {{ row.sailorCreditedOceanusWorks }} | All released works: {{ row.nodes }}
          </title>
        </rect>
      </g>

      <g v-for="event in timelineEvents" :key="event.label">
        <line
          :x1="(xScale(String(event.row.year)) ?? 0) + xScale.bandwidth() / 2"
          :x2="(xScale(String(event.row.year)) ?? 0) + xScale.bandwidth() / 2"
          :y1="margin.top"
          :y2="height - margin.bottom"
          :stroke="event.color"
          stroke-width="1"
          stroke-dasharray="3 4"
          opacity="0.72"
        />
      </g>

      <path
        v-if="sailorLine"
        :d="sailorLine"
        fill="none"
        stroke="#ea580c"
        stroke-width="2.5"
      />

      <circle
        v-for="row in sailorPoints"
        :key="`sailor-${row.year}`"
        :cx="(xScale(String(row.year)) ?? 0) + xScale.bandwidth() / 2"
        :cy="yScale(row.sailorCreditedOceanusWorks)"
        r="3"
        fill="#ea580c"
        class="cursor-pointer"
        @click="selectYear(row.year)"
      >
        <title>
          {{ row.year }} | Oceanus Folk works credited to Sailor Shift:
          {{ row.sailorCreditedOceanusWorks }}
        </title>
      </circle>

      <text
        v-for="row in xTicks"
        :key="`tick-${row.year}`"
        :x="(xScale(String(row.year)) ?? 0) + xScale.bandwidth() / 2"
        :y="height - margin.bottom + 22"
        text-anchor="middle"
        class="fill-slate-500 text-xs"
      >
        {{ row.year }}
      </text>

      <text
        :x="margin.left"
        :y="margin.top - 8"
        class="fill-slate-500 text-xs"
      >
        Number of works
      </text>

      <text
        :x="margin.left + chartWidth / 2"
        :y="height - 7"
        text-anchor="middle"
        class="fill-slate-500 text-xs"
      >
        Release year
      </text>
    </svg>

    <div class="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
      <p v-if="peakOceanusYear" class="border-l-2 border-blue-600 pl-2">
        Peak visible year:
        <strong class="font-semibold text-slate-800">{{ peakOceanusYear.year }}</strong>
        with {{ peakOceanusYear.oceanusWorks.toLocaleString() }} Oceanus Folk works.
      </p>
      <p v-if="firstSailorYear" class="border-l-2 border-orange-600 pl-2">
        First visible Oceanus Folk work credited to Sailor Shift:
        <strong class="font-semibold text-slate-800">{{ firstSailorYear.year }}</strong>.
      </p>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="event in timelineEvents"
        :key="`event-${event.label}`"
        type="button"
        class="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50"
        @click="selectYear(event.row.year)"
      >
        <span class="font-semibold">{{ event.row.year }}</span>
        {{ event.label }}
      </button>
    </div>

    <p v-if="selectedYearRow" class="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950">
      <strong>{{ selectedYearRow.year }}</strong>:
      {{ selectedYearRow.oceanusWorks.toLocaleString() }} Oceanus Folk works,
      {{ selectedYearRow.sailorCreditedOceanusWorks.toLocaleString() }} directly credited to Sailor
      Shift. Select the year again to clear it.
    </p>

    <p class="mt-2 text-xs leading-5 text-slate-500">
      Counts use unique Song and Album nodes, so multiple creative roles on the same work are not
      double-counted.
    </p>
  </article>
</template>
