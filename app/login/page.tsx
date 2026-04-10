'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-posta veya şifre hatalı.'); setLoading(false); return }
    const { data: userData } = await supabase.from('user').select('role').eq('id', data.user.id).single()
    if (userData?.role === 'ADMIN') { router.push('/admin') } else { router.push('/dealer') }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="white" strokeWidth="1.5"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '600', marginBottom: '6px' }}>Sipariş Portalı</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Hesabınıza giriş yapın</p>
        </div>

        <div style={{
          background: 'white', borderRadius: '20px', padding: '36px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155', display: 'block', marginBottom: '8px' }}>E-posta</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
              style={{
                width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', fontSize: '14px', outline: 'none',
                transition: 'border-color 0.2s', color: '#1a2332',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155', display: 'block', marginBottom: '8px' }}>Şifre</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', fontSize: '14px', outline: 'none', color: '#1a2332',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}
          <button
            onClick={handleLogin} disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#93c5fd' : '#2563eb',
              color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  )
}