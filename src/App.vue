<script setup lang="ts">
// App-skal: håller bara routervyn. Varje vy renderar sin egen sidhuvud.
</script>

<template>
  <div class="min-h-svh bg-paper text-ink">
    <router-view v-slot="{ Component }">
      <component :is="Component" class="fade-in" />
    </router-view>
  </div>
</template>
