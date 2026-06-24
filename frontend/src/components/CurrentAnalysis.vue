<script setup>
defineProps({
  sections: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <aside class="rounded-md border border-slate-300 bg-white px-4 py-3">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div class="shrink-0 lg:w-36">
        <p class="va-brand-kicker">Current reading</p>
        <p class="mt-1 text-xs text-slate-500">Visible subset</p>
      </div>
      <dl class="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
        <div
          v-for="section in sections"
          :key="section.label"
          class="min-w-0 border-l-2 border-slate-200 pl-3"
        >
          <dt class="text-xs font-semibold text-slate-600">{{ section.label }}</dt>
          <dd class="mt-1 text-sm leading-5 text-slate-800">{{ section.value }}</dd>
        </div>
      </dl>
    </div>
  </aside>
</template>
