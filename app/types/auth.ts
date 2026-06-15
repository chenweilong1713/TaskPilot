export interface AuthUser {
  id: string
  username: string
  avatarUrl: string | null
  mustResetPassword: boolean
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
