import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import RunTests from '../views/RunTests.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/run-tests',
    component: RunTests
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
