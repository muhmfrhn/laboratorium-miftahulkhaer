// Client untuk profil pengguna yang sedang login.
// PATCH /api/users/current -> { data: user }
import { patchJson } from './http'
import type { LoginData } from '../types/auth'

export interface UpdateProfilePayload {
  name?: string
  password?: string
  /** null = hapus foto, string data URL = simpan foto baru. */
  foto?: string | null
}

export function updateCurrentProfile(payload: UpdateProfilePayload): Promise<LoginData> {
  return patchJson<LoginData>('/api/users/current', payload)
}
