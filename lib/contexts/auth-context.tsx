"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getMe, logout as apiLogout } from "@/lib/auth"

type Me = {
  userId: number
  fullName: string
  email: string
  roleId: number
  roleName: string
  roleCode?: string
}

type AuthContextType = {
  user: Me | null
  isLoading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
  setUser: (u: Me | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    try {
      const me = await getMe()
      setUser(me || null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
