export type Role = 'teknisi' | 'guru' | 'siswa'
export type Status = 'aktif' | 'nonaktif'

export interface LoginData {
  email: string
  name: string | null
  foto?: string | null
  role: Role
  status: Status
  token: string
}
