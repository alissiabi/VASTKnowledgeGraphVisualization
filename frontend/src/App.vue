<script setup>
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'About', to: '/about' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">VAST KG</p>
          <h1 class="text-base font-semibold text-slate-900 md:text-lg">Dashboard Workspace</h1>
        </div>

        <nav class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl p-4 md:p-6">
      <RouterView />
    </main>
  </div>
</template>

