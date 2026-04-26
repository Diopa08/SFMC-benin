import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { decodeJwt, isTokenExpired } from '../utils/jwt'

export interface AuthUser {
  email: string
  roles: string[]
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isOperator: () => boolean
  isUser: () => boolean
  signIn: (data: { token: string }) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !isTokenExpired(token)) {
      const { sub, roles } = decodeJwt(token)
      setUser({ email: sub, roles, token })
    } else {
      localStorage.removeItem('token')
    }
  }, [])

  const signIn = ({ token }: { token: string }) => {
    const { sub, roles } = decodeJwt(token)
    const authUser: AuthUser = { email: sub, roles, token }
    localStorage.setItem('token', token)
    setUser(authUser)
  }

  const signOut = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const hasRole = (role: string) => user?.roles.includes(role) ?? false
  const isAdmin = () => hasRole('ROLE_ADMIN')
  const isOperator = () => hasRole('ROLE_OPERATOR') || hasRole('ROLE_ADMIN')
  const isUser = () => hasRole('ROLE_USER') && !hasRole('ROLE_ADMIN') && !hasRole('ROLE_OPERATOR')

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, hasRole, isAdmin, isOperator, isUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
