import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // status: 'loading' | 'authenticated' | 'unauthenticated'
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  // Verify the stored token once when the app mounts
  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setStatus('unauthenticated')
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('user', JSON.stringify(data))
          setUser(data)
          setStatus('authenticated')
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setStatus('unauthenticated')
        }
      } catch (err) {
        if (!cancelled) setStatus('unauthenticated')
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [])

  // Called by Login/Signup after a successful request
  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setStatus('authenticated')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
