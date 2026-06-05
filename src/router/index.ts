import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import RecordList from '@/views/RecordList.vue'
import RecordForm from '@/views/RecordForm.vue'
import RecordDetail from '@/views/RecordDetail.vue'

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
        path: 'records',
        name: 'RecordList',
        component: RecordList,
        meta: {
          title: '壁画记录',
          icon: 'List',
        },
      },
      {
        path: 'records/new',
        name: 'RecordNew',
        component: RecordForm,
        meta: {
          title: '新增记录',
          icon: 'Plus',
          hidden: true,
        },
      },
      {
        path: 'records/:id',
        name: 'RecordDetail',
        component: RecordDetail,
        meta: {
          title: '记录详情',
          icon: 'Document',
          hidden: true,
        },
      },
      {
        path: 'records/:id/edit',
        name: 'RecordEdit',
        component: RecordForm,
        meta: {
          title: '编辑记录',
          icon: 'Edit',
          hidden: true,
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
