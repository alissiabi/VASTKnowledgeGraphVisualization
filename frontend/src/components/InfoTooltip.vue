<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
  placement: {
    type: String,
    default: 'top',
    validator: (value) => ['top', 'bottom'].includes(value),
  },
})
</script>

<template>
  <span class="group relative inline-flex">
    <span
      tabindex="0"
      class="inline-flex items-center gap-1.5"
      :aria-label="text"
    >
      <slot />
      <span
        class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-semibold leading-none text-slate-600"
        aria-hidden="true"
      >
        ?
      </span>
    </span>
    <span
      role="tooltip"
      class="pointer-events-none absolute left-1/2 z-30 hidden w-64 -translate-x-1/2 rounded border border-slate-300 bg-slate-950 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg group-hover:block group-focus-within:block"
      :class="
        placement === 'bottom'
          ? 'top-[calc(100%+7px)]'
          : 'bottom-[calc(100%+7px)]'
      "
    >
      {{ text }}
    </span>
  </span>
</template>
