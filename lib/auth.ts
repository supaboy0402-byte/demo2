import { api } from '@/lib/api'

export async function login(email: string, password: string, rememberMe?: boolean) {
  return api('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe: !!rememberMe }),
  })
}

export async function getMe() {
  return api('/api/Auth/me')
}

export async function logout() {
  return api('/api/Auth/logout', { method: 'POST' })
}

export async function register(data: { fullName?: string; email: string; password: string; phone?: string; avatar?: string; address?: string }) {
  return api('/api/Auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
