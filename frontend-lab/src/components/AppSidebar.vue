<script setup lang="ts">
import { computed } from 'vue'
import { MENU_ITEMS, type MenuItem, type MenuKey } from '../lib/menu'
import type { LoginData } from '../types/auth'
import MenuIcon from './MenuIcon.vue'
import UserAvatar from './UserAvatar.vue'

const props = withDefaults(
  defineProps<{
    active: MenuKey
    user: LoginData
    open: boolean
    items?: MenuItem[]
  }>(),
  { items: () => MENU_ITEMS },
)

const emit = defineEmits<{
  select: [key: MenuKey]
  close: []
  logout: []
  openProfile: []
}>()

const panelLabel = computed(() => `Panel ${props.user.role}`)
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <div class="brand">
      <span class="logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 3.5v5.7l-4.9 9.2A2 2 0 0 0 6.8 21.5h10.4a2 2 0 0 0 1.7-3.1L14 9.2V3.5" />
          <path d="M8.6 3.5h6.8" />
          <path d="M7.5 15h9" />
        </svg>
      </span>
      <span class="brand-text">
        <strong>Lab Schedule</strong>
        <span>{{ panelLabel }}</span>
      </span>
    </div>

    <nav aria-label="Menu utama">
      <p class="nav-label">Menu</p>
      <button
        v-for="item in props.items"
        :key="item.key"
        class="menu-btn"
        :class="{ active: item.key === active }"
        :aria-current="item.key === active ? 'page' : undefined"
        @click="emit('select', item.key); emit('close')"
      >
        <MenuIcon :name="item.key" />
        <span class="txt">
          <strong>{{ item.label }}</strong>
          <small>{{ item.desc }}</small>
        </span>
      </button>
    </nav>

    <div class="foot">
      <button
        type="button"
        class="who-card"
        aria-label="Buka profil pengguna"
        title="Buka profil pengguna"
        @click="emit('openProfile'); emit('close')"
      >
        <UserAvatar :name="user.name" :email="user.email" :foto="user.foto" :size="34" />
        <span class="who-text">
          <span class="who">{{ user.name ?? user.email }}</span>
          <span class="role">{{ user.role }}</span>
        </span>
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <button class="btn logout" @click="emit('logout')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9.5 4.5H6.6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2.9" />
          <path d="M14.6 15.6 18.6 12l-4-3.6" />
          <path d="M18.2 12H9.5" />
        </svg>
        Keluar
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  width: 256px;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: var(--card-soft);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 18px 16px;
}
.logo {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  color: #fff;
  background: linear-gradient(140deg, var(--brand-2), var(--brand));
  box-shadow: 0 12px 22px -13px rgba(109, 90, 224, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
.logo svg {
  width: 21px;
  height: 21px;
}
.brand-text {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.brand-text strong {
  font-size: 15.5px;
  font-weight: 650;
  letter-spacing: -0.3px;
  color: var(--ink);
}
.brand-text span {
  font-size: 12px;
  color: var(--muted);
}

nav {
  display: grid;
  gap: 5px;
  padding: 6px 14px 14px;
  flex: 1;
  align-content: start;
  overflow-y: auto;
}
.nav-label {
  margin: 8px 4px 4px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.75;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 14.5px;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease,
    transform 0.18s ease, box-shadow 0.18s ease;
}
.menu-btn .txt {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.menu-btn .txt strong {
  font-weight: 600;
  font-size: 14.5px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-btn .txt small {
  font-size: 11.5px;
  line-height: 1.3;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-btn:hover {
  background: var(--field);
  border-color: var(--line);
  transform: translateX(2px);
}
.menu-btn.active {
  background: linear-gradient(135deg, var(--brand-2), var(--brand));
  border-color: transparent;
  box-shadow: 0 14px 24px -16px rgba(109, 90, 224, 0.95);
}
.menu-btn.active .txt strong,
.menu-btn.active .txt small {
  color: #fff;
}
.menu-btn.active .txt small {
  opacity: 0.82;
}
.menu-btn.active:hover {
  transform: translateX(2px);
}
.menu-btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.foot {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid var(--line);
}
.who-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--field);
  color: var(--muted);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  min-width: 0;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}
.who-card:hover {
  background: var(--card);
  border-color: rgba(109, 90, 224, 0.4);
  transform: translateY(-1px);
}
.who-card:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.who-text {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.chev {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: var(--muted);
  opacity: 0.7;
  transition: transform 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}
.who-card:hover .chev {
  transform: translateX(2px);
  color: var(--brand-ink);
  opacity: 1;
}
.who {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.role {
  margin: 0;
  font-size: 11.5px;
  text-transform: capitalize;
  color: var(--muted);
}

.btn.logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}
.btn.logout svg {
  width: 17px;
  height: 17px;
}
.btn.logout:hover {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
  transform: translateY(-1px);
}
.btn.logout:focus-visible {
  outline: 2px solid var(--danger);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 20;
    top: 0;
    bottom: 0;
    left: 0;
    height: auto;
    transform: translateX(-100%);
    transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    background: var(--card);
  }
  .sidebar.open {
    transform: none;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.28);
  }
}
</style>
