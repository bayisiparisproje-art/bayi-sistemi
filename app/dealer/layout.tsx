'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [dealerName, setDealerName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('dealer').select('name').eq('user_id', user.id).single()
      if (data) setDealerName(data.name)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dealer', label: 'Yeni Sipariş' },
    { href: '/dealer/orders', label: 'Siparişlerim' },
    { href: '/dealer/balance', label: 'Bakiyem' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: '#1e3a8a', padding: '0 32px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(30,58,138,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h12M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>Sipariş Portalı</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {dealerName && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{dealerName}</span>}
          <button onClick={handleLogout} style={{
            color: 'rgba(255,255,255,0.7)', background: 'none', border: '1px solid rgba(255,255,255,0.2)',
            padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
          }}>Çıkış</button>
        </div>
      </div>

      <div style={{
        background: 'white', padding: '0 32px',
        borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px',
      }}>
        {navItems.map(item => (
          <a key={item.href} href={item.href} style={{
            padding: '14px 16px', fontSize: '13px', fontWeight: '500', textDecoration: 'none',
            borderBottom: pathname === item.href ? '2px solid #2563eb' : '2px solid transparent',
            color: pathname === item.href ? '#2563eb' : '#64748b',
            transition: 'color 0.15s',
          }}>
            {item.label}
          </a>
        ))}
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 32px' }}>
        {children}
      </div>
    </div>
  )
}