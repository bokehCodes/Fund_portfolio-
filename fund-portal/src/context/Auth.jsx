import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        setSession(data.session)
      } catch (error) {
        console.error('Failed to restore authentication session.', error)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setLoading(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Failed to load user profile.', error)
      setProfile(null)
    }
  }
  useEffect(() => {
    if (!uid) return
    setLoading(true)
    const loadProfile = async () => {
      try {
        await fetchProfile()
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [uid])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()
  const refreshProfile = () => (uid ? fetchProfile() : Promise.resolve())

  return <Ctx.Provider value={{ session, profile, loading, signIn, signOut, refreshProfile }}>{children}</Ctx.Provider>
}
