import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const PRESETS = {
  midnight: { bg: '#0b1220', surface: '#121b2e', text: '#e8edf7', muted: '#8b97ad', primary: '#5eead4', accent: '#f5c451' },
  ivory: { bg: '#faf8f4', surface: '#ffffff', text: '#1c1917', muted: '#78716c', primary: '#1c1917', accent: '#b45309' },
  forest: { bg: '#0f1a14', surface: '#16251c', text: '#e6f1ea', muted: '#8aa396', primary: '#86efac', accent: '#fbbf24' },
  royal: { bg: '#f5f7ff', surface: '#ffffff', text: '#0f172a', muted: '#64748b', primary: '#2f3fd4', accent: '#e11d74' },
}

export function applyPalette(p) {
  const root = document.documentElement.style
  Object.entries(p).forEach(([k, v]) => root.setProperty('--' + k, v))
}

const Ctx = createContext(null)
export const useSettings = () => useContext(Ctx)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  const load = async () => {
    let s = {}
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
      if (error) throw error
      s = data || {}
    } catch (error) {
      console.error('Failed to load site settings; using defaults.', error)
    } finally {
      s.palette = { ...PRESETS.midnight, ...(s.palette || {}) }
      s.services = Array.isArray(s.services) ? s.services : []
      applyPalette(s.palette)
      document.title = s.site_name || 'Portal'
      setSettings(s)
    }
  }
  useEffect(() => { load() }, [])

  if (!settings) return <div className="center">Loading…</div>
  return <Ctx.Provider value={{ settings, reload: load }}>{children}</Ctx.Provider>
}
