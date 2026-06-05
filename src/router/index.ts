import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import AreaList from '@/views/AreaList.vue'
import AreaDetail from '@/views/AreaDetail.vue'
import AreaForm from '@/views/AreaForm.vue'
import AlertBoard from '@/views/AlertBoard.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '数据概览',
          icon: 'DataLine',
        },
      },
      {
        path: 'areas',
        name: 'AreaList',
        component: AreaList,
        meta: {
          title: '区域档案',
          icon: 'Picture',
        },
      },
      {
        path: 'areas/new',
        name: 'AreaCreate',
        component: AreaForm,
        meta: {
          title: '新增区域',
          icon: 'Plus',
          hidden: true,
        },
      },
      {
        path: 'areas/:id',
        name: 'AreaDetail',
        component: AreaDetail,
        meta: {
          title: '区域详情',
          icon: 'Document',
          hidden: true,
        },
      },
      {
        path: 'areas/:id/edit',
        name: 'AreaEdit',
        component: AreaForm,
        meta: {
          title: '编辑区域',
          icon: 'Edit',
          hidden: true,
        },
      },
      {
        path: 'alerts',
        name: 'AlertBoard',
        component: AlertBoard,
        meta: {
          title: '风险预警',
          icon: 'Warning',
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const title = to.meta?.title as string
  if (title) {
    document.title = `${title} - 石窟壁画保护记录系统`
  } else {
    document.title = '石窟壁画保护记录系统'
  }
  next()
})

export default router
