import { supabase } from './supabase'

export const CLASS_LABEL = {
  bonds: 'Bonds',
  crypto: 'Cryptocurrency',
  precious_metals: 'Precious metals',
  cash: 'Cash',
  other: 'Other',
}
export const TYPE_LABEL = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  profit: 'Profit',
  loss: 'Loss',
  fee: 'Fee',
}
const SIGN = { deposit: 1, profit: 1, withdrawal: -1, loss: -1, fee: -1 }

export const signed = (t) => SIGN[t.type] * Number(t.amount)

export function money(n, cur = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(Number(n) || 0)
  } catch {
    return (Number(n) || 0).toFixed(2) + ' ' + cur
  }
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export function stats(txs) {
  let balance = 0, deposits = 0, withdrawals = 0, profit = 0
  const byClass = {}
  txs.forEach((t) => {
    const v = signed(t)
    balance += v
    if (t.type === 'deposit') deposits += Number(t.amount)
    if (t.type === 'withdrawal') withdrawals += Number(t.amount)
    if (['profit', 'loss', 'fee'].includes(t.type)) {
      profit += v
      const k = t.asset_class || 'other'
      byClass[k] = (byClass[k] || 0) + v
    }
  })
  return { balance, deposits, withdrawals, profit, netContributed: deposits - withdrawals, byClass }
}

export function balanceSeries(txs) {
  const sorted = [...txs].sort((a, b) => (a.occurred_on > b.occurred_on ? 1 : -1))
  let run = 0
  return sorted.map((t) => {
    run += signed(t)
    return { x: t.occurred_on, y: run }
  })
}

export async function uploadImage(file, folder = 'misc') {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('site-assets').upload(path, file, { cacheControl: '3600' })
  if (error) throw error
  return supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl
}
