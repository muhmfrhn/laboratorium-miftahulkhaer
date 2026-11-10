<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '../composables/useToast'
import { ApiError } from '../lib/http'
import { updateCurrentProfile, type UpdateProfilePayload } from '../lib/profile-api'
import type { LoginData } from '../types/auth'
import UserAvatar from './UserAvatar.vue'

const props = defineProps<{
  open: boolean
  user: LoginData
}>()

const emit = defineEmits<{
  close: []
  saved: [user: LoginData]
  sessionExpired: []
}>()

const { notify } = useToast()

const MAX_FILE_BYTES = 5 * 1024 * 1024
const AVATAR_SIZE = 256
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const foto = ref<string | null>(null)
const fotoChanged = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const processingPhoto = ref(false)
const saving = ref(false)
const errorMsg = ref('')

function resetForm(): void {
  name.value = props.user.name ?? ''
  password.value = ''
  confirmPassword.value = ''
  foto.value = props.user.foto ?? null
  fotoChanged.value = false
  errorMsg.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  },
  { immediate: true },
)

function pickPhoto(): void {
  if (processingPhoto.value) return
  fileInput.value?.click()
}

function removePhoto(): void {
  foto.value = null
  fotoChanged.value = true
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca file gambar'))
    }
    image.src = url
  })
}

// Crop tengah + resize agar payload profil tetap kecil dan konsisten.
async function fileToDataUrl(file: File): Promise<string> {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar')
  ctx.imageSmoothingQuality = 'high'

  const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height)
  const width = image.width * scale
  const height = image.height * scale
  ctx.drawImage(
    image,
    (AVATAR_SIZE - width) / 2,
    (AVATAR_SIZE - height) / 2,
    width,
    height,
  )

  let quality = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > 380_000 && quality > 0.4) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  if (dataUrl.length > 400_000) throw new Error('Foto terlalu besar, pilih gambar lain')
  return dataUrl
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    errorMsg.value = 'Format foto harus JPG, PNG, atau WebP'
    return
  }
  if (file.size > MAX_FILE_BYTES) {
    errorMsg.value = 'Ukuran file maksimal 5 MB'
    return
  }

  processingPhoto.value = true
  errorMsg.value = ''
  try {
    foto.value = await fileToDataUrl(file)
    fotoChanged.value = true
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Gagal memproses foto'
  } finally {
    processingPhoto.value = false
  }
}

async function onSubmit(): Promise<void> {
  errorMsg.value = ''
  const cleanName = name.value.trim()

  if (!cleanName) {
    errorMsg.value = 'Nama tidak boleh kosong'
    return
  }
  if (password.value && password.value.length < 8) {
    errorMsg.value = 'Password baru minimal 8 karakter'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Konfirmasi password tidak cocok'
    return
  }

  const previousName = (props.user.name ?? '').trim()
  const changed =
    cleanName !== previousName || Boolean(password.value) || fotoChanged.value
  if (!changed) {
    errorMsg.value = 'Tidak ada perubahan untuk disimpan'
    return
  }

  const payload: UpdateProfilePayload = { name: cleanName }
  if (password.value) payload.password = password.value
  if (fotoChanged.value) payload.foto = foto.value

  saving.value = true
  try {
    const updated = await updateCurrentProfile(payload)
    notify('Profil berhasil diperbarui', 'success')
    emit('saved', updated)
    emit('close')
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 0
    if (status === 401) {
      emit('sessionExpired')
      emit('close')
      return
    }
    errorMsg.value = e instanceof Error ? e.message : 'Gagal menyimpan profil'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="!saving && emit('close')">
    <section
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-dialog-title"
      :aria-busy="saving || processingPhoto"
    >
      <header class="head">
        <div>
          <p class="eyebrow">Akun saya</p>
          <h2 id="profile-dialog-title">Profil Pengguna</h2>
        </div>
        <button class="icon-btn" aria-label="Tutup" :disabled="saving" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div class="identity">
        <UserAvatar :name="name" :email="user.email" :foto="foto" :size="88" alt="Foto profil" />
        <div class="identity-info">
          <p class="mail">{{ user.email }}</p>
          <p class="role">{{ user.role }} · {{ user.status }}</p>
          <div class="photo-actions">
            <button class="btn ghost small" :disabled="processingPhoto || saving" @click="pickPhoto">
              {{ processingPhoto ? 'Memproses...' : 'Pilih foto' }}
            </button>
            <button
              v-if="foto"
              class="btn danger small"
              :disabled="processingPhoto || saving"
              @click="removePhoto"
            >
              Hapus foto
            </button>
          </div>
          <p class="hint">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
        </div>
        <input
          ref="fileInput"
          class="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onFileChange"
        />
      </div>

      <label class="field">
        <span>Nama</span>
        <input v-model="name" type="text" maxlength="100" placeholder="Nama lengkap" />
      </label>

      <div class="password-section">
        <p class="section-title">Ganti password <span>(opsional)</span></p>
        <div class="grid">
          <label class="field">
            <span>Password baru</span>
            <input
              v-model="password"
              type="password"
              placeholder="min. 8 karakter"
              autocomplete="new-password"
            />
          </label>
          <label class="field">
            <span>Konfirmasi password</span>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="ulangi password baru"
              autocomplete="new-password"
            />
          </label>
        </div>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div class="actions">
        <button class="btn ghost" :disabled="saving" @click="emit('close')">Batal</button>
        <button class="btn primary" :disabled="saving || processingPhoto" @click="onSubmit">
          {{ saving ? 'Menyimpan...' : 'Simpan profil' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(22, 18, 44, 0.42);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade 0.2s ease both;
}
.dialog {
  width: min(540px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
  padding: 24px 26px 22px;
  display: grid;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow-2);
  animation: rise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand-ink);
  opacity: 0.85;
}
h2 {
  margin: 0;
  color: var(--ink);
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--field);
  color: var(--muted);
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}
.icon-btn svg {
  width: 17px;
  height: 17px;
}
.icon-btn:hover:not(:disabled) {
  background: var(--danger-soft);
  border-color: var(--danger-soft);
  color: var(--danger);
}
.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.identity {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  margin: 4px 0 8px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--field);
}
.identity-info {
  min-width: 0;
  flex: 1;
}
.mail {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.role {
  margin: 2px 0 0;
  font-size: 12px;
  text-transform: capitalize;
  color: var(--muted);
}
.photo-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.hint {
  margin: 7px 0 0;
  font-size: 11.5px;
  color: var(--muted);
}
.file-input {
  display: none;
}
.field {
  display: grid;
  gap: 6px;
  margin: 8px 0;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--muted);
}
input[type='text'],
input[type='password'] {
  box-sizing: border-box;
  min-width: 0;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--field);
  color: var(--ink);
  font-family: inherit;
  font-size: 15px;
  letter-spacing: normal;
  text-transform: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
input::placeholder {
  color: var(--muted);
}
input:focus {
  outline: none;
  border-color: rgba(109, 90, 224, 0.55);
  box-shadow: 0 0 0 4px var(--brand-soft);
  background: var(--card);
}
.password-section {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.section-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}
.section-title span {
  font-weight: 400;
  color: var(--muted);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.error {
  margin: 8px 0 0;
  padding: 10px 13px;
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13.5px;
  line-height: 1.45;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 18px;
  border-radius: var(--r-md);
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  width: auto;
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease,
    color 0.16s ease, box-shadow 0.16s ease;
}
.btn.small {
  padding: 7px 12px;
  font-size: 12.5px;
}
.btn:focus-visible,
.icon-btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.btn.ghost {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
}
.btn.ghost:hover:not(:disabled) {
  background: var(--card);
  border-color: rgba(109, 90, 224, 0.4);
  color: var(--brand-ink);
}
.btn.primary {
  background: linear-gradient(135deg, var(--brand-2), var(--brand));
  border: 1px solid transparent;
  color: #fff;
  box-shadow: 0 14px 24px -16px rgba(109, 90, 224, 0.95);
}
.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.btn.danger {
  background: var(--danger-soft);
  border: 1px solid var(--danger-soft);
  color: var(--danger);
}
.btn.danger:hover:not(:disabled) {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:disabled:hover {
  transform: none;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
}
@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .identity {
    align-items: flex-start;
  }
}
@media (prefers-reduced-motion: reduce) {
  .overlay,
  .dialog {
    animation: none;
  }
}
</style>
