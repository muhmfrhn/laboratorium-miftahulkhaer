<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import { SISWA_MENU_ITEMS, type MenuKey } from '../lib/menu'
import type { LoginData } from '../types/auth'
import DashboardHome from './DashboardHome.vue'
import SiswaJadwalHariIni from './SiswaJadwalHariIni.vue'

defineProps<{ user: LoginData }>()

const emit = defineEmits<{ sessionExpired: []; logout: []; openProfile: [] }>()

type SiswaMenu = 'dashboard' | 'jadwal'

const activeMenu = ref<SiswaMenu>('dashboard')
const sidebarOpen = ref(false)
const jadwalView = ref<InstanceType<typeof SiswaJadwalHariIni> | null>(null)

function selectMenu(key: MenuKey) {
  if (key === 'dashboard' || key === 'jadwal') activeMenu.value = key
}

function onRefresh() {
  if (activeMenu.value === 'jadwal') jadwalView.value?.refresh()
}
</script>

<template>
  <div class="layout">
    <div v-if="sidebarOpen" class="backdrop" @click="sidebarOpen = false" />
    <AppSidebar
      :active="activeMenu"
      :user="user"
      :open="sidebarOpen"
      :items="SISWA_MENU_ITEMS"
      @select="selectMenu"
      @close="sidebarOpen = false"
      @open-profile="emit('openProfile')"
      @logout="emit('logout')"
    />
    <div class="content">
      <div class="topbar">
        <button class="hamburger" aria-label="Buka menu" @click="sidebarOpen = !sidebarOpen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
        <DashboardHeader :user="user" @refresh="onRefresh" @logout="emit('logout')" />
      </div>
      <Transition name="view-swap" mode="out-in">
        <DashboardHome v-if="activeMenu === 'dashboard'" key="dashboard" :user="user" :items="SISWA_MENU_ITEMS" @select="selectMenu" />
        <section v-else :key="activeMenu" class="view">
          <h2>Jadwal Lab Hari Ini</h2>
          <SiswaJadwalHariIni ref="jadwalView" @session-expired="emit('sessionExpired')" />
        </section>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  text-align: left;
}
.content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 22px;
  padding: 26px 30px 34px;
  align-content: start;
  box-sizing: border-box;
}
.topbar {
  display: grid;
  gap: 12px;
}
.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-1);
  cursor: pointer;
}
.hamburger svg {
  width: 20px;
  height: 20px;
}
.hamburger:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.view {
  display: grid;
  gap: 18px;
  align-content: start;
}
.view h2 {
  margin: 0;
  color: var(--ink);
}
.view-swap-enter-active,
.view-swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.view-swap-enter-from,
.view-swap-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (prefers-reduced-motion: reduce) {
  .view-swap-enter-active,
  .view-swap-leave-active {
    transition: none;
  }
}
.backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 40, 0.42);
  backdrop-filter: blur(2px);
  z-index: 15;
}
@media (max-width: 768px) {
  .hamburger {
    display: inline-flex;
  }
  .backdrop {
    display: block;
  }
  .content {
    padding: 18px 16px 28px;
    gap: 18px;
  }
}
</style>
