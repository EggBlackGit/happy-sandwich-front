import { createRouter, createWebHistory } from 'vue-router'
import OrdersPage from '../pages/OrdersPage.vue'
import OverviewPage from '../pages/OverviewPage.vue'
import MenuPage from '../pages/MenuPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'orders',
      component: OrdersPage,
    },
    {
      path: '/overview',
      name: 'overview',
      component: OverviewPage,
    },
    {
      path: '/menu',
      name: 'menu',
      component: MenuPage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
