'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type PriceGroup = { id: string; code: string; name: string; description: string | null }
type Product = { id: string; code: string; name: string; base_price: number }
type Rate = { id: string; price_group_id: string; product_id: string; discount_rate: number }

export default function PricingPage() {
  const [groups, setGroups] = useState<PriceGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupForm, setGroupForm] = useState({ code: '', name: '', description: '' })
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [g, p, r] = await Promise.all([
      supabase.from('price_group').select('*').order('code'),
      supabase.from('product').select('id, code, name, base_price').eq('status', 'ACTIVE').order('code'),
      supabase.from('price_group_rate').select('*'),
    ])
    setGroups(g.data || [])
    setProducts(p.data || [])
    setRates(r.data || [])
  }

  async function handleSaveGroup() {
    if (!groupForm.code || !groupForm.name) return
    await supabase.from('price_group').insert({
      code: groupForm.code, name: groupForm.name, description: groupForm.description,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    })
    setShowGroupForm(false)
    setGroupForm({ code: '', name: '', description: '' })
    loadAll()
  }

  async function handleRateChange(groupId: string, productId: string, value: string) {
    const rate = parseFloat(value)
    if (isNaN(rate)) return
    const existing = rates.find(r => r.price_group_id === groupId && r.product_id === productId)
    if (existing) {
      await supabase.from('price_group_rate').update({ discount_rate: rate, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('price_group_rate').insert({
        price_group_id: groupId, product_id: productId, discount_rate: rate,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
    }
    loadAll()
  }

  function getRate(groupId: string, productId: string) {
    const r = rates.find(r => r.price_group_id === groupId && r.product_id === productId)
    return r ? r.discount_rate : ''
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a' }}>Fiyatlandırma</h1>
        <button onClick={() => setShowGroupForm(true)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          + Yeni Grup
        </button>
      </div>

      {showGroupForm && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Yeni Fiyat Grubu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Kod', key: 'code', placeholder: 'GROUP_A' },
              { label: 'Ad', key: 'name', placeholder: 'Grup A' },
              { label: 'Açıklama', key: 'description', placeholder: 'Büyük bayiler' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input value={(groupForm as any)[f.key]} onChange={e => setGroupForm({ ...groupForm, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowGroupForm(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: 'white' }}>İptal</button>
            <button onClick={handleSaveGroup} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Henüz fiyat grubu yok
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Her hücreye indirim oranı girin (%), kutucuktan çıkınca otomatik kaydedilir</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Ürün</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Taban Fiyat</th>
                  {groups.map(g => (
                    <th key={g.id} style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '6px', fontSize: '12px' }}>{g.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#1a2332' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.code}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#1e3a8a' }}>TL{Number(p.base_price).toFixed(2)}</td>
                    {groups.map(g => (
                      <td key={g.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <input
                            type="number" defaultValue={getRate(g.id, p.id)} min="0" max="100"
                            onBlur={e => handleRateChange(g.id, p.id, e.target.value)}
                            style={{ width: '60px', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', textAlign: 'center', outline: 'none', background: 'white', color: '#1a2332' }}
                          />
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>%</span>
                        </div>
                        {getRate(g.id, p.id) !== '' && (
                          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: '500' }}>
                            TL{(Number(p.base_price) * (1 - Number(getRate(g.id, p.id)) / 100)).toFixed(2)}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}