import { supabase } from './supabase'

function sessionId() {
  try {
    let s = sessionStorage.getItem('fp_sid')
    if (!s) { s = crypto.randomUUID(); sessionStorage.setItem('fp_sid', s) }
    return s
  } catch { return null }
}

function parseUA(ua) {
  const device_type = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
  const os = /windows/i.test(ua) ? 'Windows' : /android/i.test(ua) ? 'Android' : /iphone|ipad|ios/i.test(ua) ? 'iOS'
    : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other'
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /chrome|crios/i.test(ua) ? 'Chrome'
    : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other'
  return { device_type, os, browser }
}

// Only called for signed-in clients who have signed the consent.
// The database also refuses the insert if consent is missing.
export async function track(path, event = 'page_view') {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    const ua = navigator.userAgent
    await fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        event,
        path,
        user_id: data.session.user.id,
        session_id: sessionId(),
        referrer: document.referrer || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        user_agent: ua,
        ...parseUA(ua),
      }),
    })
  } catch { /* logging must never break the site */ }
}
