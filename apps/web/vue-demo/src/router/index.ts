import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
const modules = import.meta.glob('@/views/**/*.vue')
const autoRoutes = []
for (let path in modules) {
  if(path) {
    const fileName = path.split('/')!.pop()!.replace('.vue', '')
    autoRoutes.push({
      path: '/' + fileName,
      component: modules[path],
      name: fileName.toLocaleUpperCase()
    })
  }
}
console.log('=====autoRoutes', autoRoutes)
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/rx_demo.vue')
  },
  // ...autoRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  routes,
  history: createWebHistory(), //createWebHistory(),createWebHashHistory
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.onError((err, to, from) => {
  console.error('Router Error to:', to)
  console.error('Router Error from:', from)
  console.error(err)
})
export default router
