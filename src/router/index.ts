import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Hash-routing är obligatoriskt: GitHub Pages stöder inte client-side
// history-routing för djuplänkar. Se CLAUDE.md.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'gm-case-select',
    component: () => import('../views/gm/GMCaseSelectView.vue'),
    meta: { title: 'Välj fall' },
  },
  {
    path: '/case/:caseId/gm',
    name: 'gm-dashboard',
    component: () => import('../views/gm/GMDashboardView.vue'),
    props: true,
    meta: { title: 'GM-läge' },
  },
  {
    path: '/case/:caseId/player',
    name: 'player-case',
    component: () => import('../views/player/PlayerCaseView.vue'),
    props: true,
    meta: { title: 'Utredningsakt' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? ''
  document.title = title
    ? `${title} — Arkivet`
    : 'Arkivet — Mordgåtor'
})
