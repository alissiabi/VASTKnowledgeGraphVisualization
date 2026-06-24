<script setup>
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'About', to: '/about' },
]
</script>

<template>
  <div class="min-h-screen">
    <header class="va-topbar">
      <div class="va-topbar-inner">
        <div>
          <p class="va-brand-kicker">VA602AA</p>
          <h1 class="va-brand-title">VAST 2025 MC1 Graph Explorer</h1>
        </div>

        <nav class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="va-nav-link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

      </div>
    </header>

    <main class="va-page">
      <RouterView />
    </main>
  </div>
</template>
