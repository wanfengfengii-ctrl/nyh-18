<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const userDropdownVisible = ref(false)

const menuItems = computed(() => {
  const routes = router.options.routes[0]?.children || []
  return routes.filter((r: RouteRecordRaw) => !r.meta?.hidden)
})

const activeMenu = computed(() => {
  if (route.path.startsWith('/areas')) {
    return '/areas'
  }
  return route.path
})

const userName = '文保管理员'

function handleSelect(key: string) {
  router.push(key)
}

function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}

function handleLogout() {
  userDropdownVisible.value = false
}

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <el-container class="main-layout">
    <el-aside
      :width="isCollapse ? '64px' : '220px'"
      class="sidebar"
    >
      <div
        class="logo"
        @click="goHome"
      >
        <img
          src="/favicon.svg"
          alt="Logo"
          class="logo-icon"
        >
        <span
          v-if="!isCollapse"
          class="logo-text"
        >壁画保护系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#2c2416"
        text-color="#d8c49a"
        active-text-color="#c4a76c"
        class="sidebar-menu"
        @select="handleSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.meta?.icon" /></el-icon>
          <template #title>
            {{ item.meta?.title }}
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="toggle-btn"
            @click="toggleSidebar"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta?.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown
            v-model:visible="userDropdownVisible"
            @command="handleLogout"
          >
            <span class="user-info">
              <el-avatar
                :size="32"
                class="user-avatar"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item
                  command="logout"
                  divided
                >
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <RouterView v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.main-layout {
  height: 100%;
}

.sidebar {
  background-color: var(--color-bg-sidebar);
  transition: var(--transition-base);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .logo-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .logo-text {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-primary-light);
    white-space: nowrap;
    overflow: hidden;
  }
}

.sidebar-menu {
  border-right: none;
  flex: 1;

  :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;

    &.is-active {
      background-color: rgba(196, 167, 108, 0.15);
    }

    &:hover {
      background-color: rgba(196, 167, 108, 0.1);
    }
  }
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: var(--header-height);
  background-color: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-regular);
  transition: var(--transition-fast);

  &:hover {
    color: var(--color-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-base);
  transition: var(--transition-fast);

  &:hover {
    background-color: var(--color-bg-body);
  }
}

.user-avatar {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--color-bg-body);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
