'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/admin', label: 'Özet' },
    { href: '/admin/orders', label: 'Siparişler' },
    { href: '/admin/dealers', label: 'Bayiler' },
    { href: '/admin/products', label: 'Ürünler' },
    { href: '/admin/pricing', label: 'Fiyatlandırma' },
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
              <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="white" strokeWidth="1.5"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>Yönetim Paneli</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Admin</span>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px' }}>
        {children}
      </div>
    </div>
  )
}