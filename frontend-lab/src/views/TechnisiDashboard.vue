<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import { type MenuKey } from '../lib/menu'
import type { LoginData } from '../types/auth'
import CategoryManagement from './CategoryManagement.vue'
import DashboardHome from './DashboardHome.vue'
import InventoryManagement from './InventoryManagement.vue'
import JadwalManagement from './JadwalManagement.vue'
import LaboratoriumManagement from './LaboratoriumManagement.vue'
import LaporanPenggunaanLab from './LaporanPenggunaanLab.vue'
import UsersManagement from './UsersManagement.vue'

defineProps<{ user: LoginData }>()

const emit = defineEmits<{ sessionExpired: []; logout: []; openProfile: [] }>()

const activeMenu = ref<MenuKey>('dashboard')
const sidebarOpen = ref(false)
const usersView = ref<InstanceType<typeof UsersManagement> | null>(null)
const labView = ref<InstanceType<typeof LaboratoriumManagement> | null>(null)
const categoryView = ref<InstanceType<typeof CategoryManagement> | null>(null)
const inventoryView = ref<InstanceType<typeof InventoryManagement> | null>(null)
const jadwalView = ref<InstanceType<typeof JadwalManagement> | null>(null)
const laporanView = ref<InstanceType<typeof LaporanPenggunaanLab> | null>(null)

function selectMenu(key: MenuKey) {
  activeMenu.value = key
}

function onRefresh() {
  if (activeMenu.value === 'users') usersView.value?.refresh()
  if (activeMenu.value === 'laboratorium') labView.value?.refresh()
  if (activeMenu.value === 'category') categoryView.value?.refresh()
  if (activeMenu.value === 'inventory') inventoryView.value?.refresh()
  if (activeMenu.value === 'jadwal') jadwalView.value?.refresh()
  if (activeMenu.value === 'laporan') laporanView.value?.refresh()
}
</script>

<template>
  <div class="layout">
    <div v-if="sidebarOpen" class="backdrop" @click="sidebarOpen = false" />
    <AppSidebar
      :active="activeMenu"
      :user="user"
      :open="sidebarOpen"
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
        <DashboardHome v-if="activeMenu === 'dashboard'" key="dashboard" :user="user" @select="selectMenu" />
        <section v-else-if="activeMenu === 'users'" :key="activeMenu" class="view">
          <h2>User Management</h2>
          <UsersManagement ref="usersView" @session-expired="emit('sessionExpired')" />
        </section>
        <section v-else-if="activeMenu === 'laboratorium'" :key="activeMenu" class="view">
          <h2>Laboratorium</h2>
          <LaboratoriumManagement ref="labView" @session-expired="emit('sessionExpired')" />
        </section>
        <section v-else-if="activeMenu === 'category'" :key="activeMenu" class="view">
          <h2>Kategori</h2>
          <CategoryManagement ref="categoryView" @session-expired="emit('sessionExpired')" />
        </section>
        <section v-else-if="activeMenu === 'inventory'" :key="activeMenu" class="view">
          <h2>Inventory</h2>
          <InventoryManagement ref="inventoryView" @session-expired="emit('sessionExpired')" />
        </section>
        <section v-else-if="activeMenu === 'jadwal'" :key="activeMenu" class="view">
          <h2>Jadwal</h2>
          <JadwalManagement ref="jadwalView" @session-expired="emit('sessionExpired')" />
        </section>
        <section v-else-if="activeMenu === 'laporan'" :key="activeMenu" class="view">
          <h2>Laporan Penggunaan Lab</h2>
          <LaporanPenggunaanLab ref="laporanView" @session-expired="emit('sessionExpired')" />
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
