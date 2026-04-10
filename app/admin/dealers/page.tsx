'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Dealer = {
  id: string
  code: string
  name: string
  email: string
  phone: string | null
  region: string | null
  payment_terms: number
  status: string
  price_group_id: string | null
  price_group?: { name: string }
}

type PriceGroup = {
  id: string
  name: string
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [groups, setGroups] = useState<PriceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', email: '', phone: '', region: '', payment_terms: '30', price_group_id: '', password: '' })
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [d, g] = await Promise.all([
      supabase.from('dealer').select('*, price_group(name)').order('code'),
      supabase.from('price_group').select('id, name').order('code'),
    ])
    setDealers(d.data || [])
    setGroups(g.data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.code || !form.name || !form.email || !form.password) return
    const res = await fetch('/api/create-dealer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email, password: form.password, code: form.code,
        name: form.name, phone: form.phone, region: form.region,
        payment_terms: parseInt(form.payment_terms), price_group_id: form.price_group_id,
      }),
    })
    if (!res.ok) { const err = await res.json(); alert('Hata: ' + err.error); return }
    setShowForm(false)
    setForm({ code: '', name: '', email: '', phone: '', region: '', payment_terms: '30', price_group_id: '', password: '' })
    loadAll()
  }

  async function handleGroupChange(dealerId: string, groupId: string) {
    await supabase.from('dealer').update({ price_group_id: groupId || null, updated_at: new Date().toISOString() }).eq('id', dealerId)
    loadAll()
  }

  const statusColor: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: '#dcfce7', color: '#14532d' },
    PASSIVE: { bg: '#f1f5f9', color: '#475569' },
    BLOCKED: { bg: '#fee2e2', color: '#7f1d1d' },
  }
  const statusLabel: Record<string, string> = { ACTIVE: 'Aktif', PASSIVE: 'Pasif', BLOCKED: 'Bloke' }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a' }}>Bayiler</h1>
        <button onClick={() => setShowForm(true)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          + Yeni Bayi
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Yeni Bayi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Kod', key: 'code', placeholder: 'ANK-001' },
              { label: 'Firma Adı', key: 'name', placeholder: 'Ankara Dağıtım A.Ş.' },
              { label: 'E-posta', key: 'email', placeholder: 'bayi@firma.com', type: 'email' },
              { label: 'Şifre', key: 'password', placeholder: '••••••••', type: 'password' },
              { label: 'Telefon', key: 'phone', placeholder: '0532 000 0000' },
              { label: 'Bölge', key: 'region', placeholder: 'Ankara' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Vade (gün)</label>
              <input type="number" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Fiyat Grubu</label>
              <select value={form.price_group_id} onChange={e => setForm({ ...form, price_group_id: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                <option value="">— Seçin —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: 'white' }}>İptal</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <p style={{ padding: '20px', fontSize: '13px', color: '#94a3b8' }}>Yükleniyor...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Kod', 'Firma', 'Bölge', 'Fiyat Grubu', 'Vade', 'Durum', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dealers.length === 0 && <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Henüz bayi yok</td></tr>}
              {dealers.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{d.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500', color: '#1a2332' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.region || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={d.price_group_id || ''} onChange={e => handleGroupChange(d.id, e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: '#1a2332', outline: 'none' }}>
                      <option value="">— Yok —</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.payment_terms} gün</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', background: statusColor[d.status]?.bg, color: statusColor[d.status]?.color }}>
                      {statusLabel[d.status] || d.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <a href={`/admin/dealers/${d.id}/overrides`} style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                      Özel İndirimler
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}