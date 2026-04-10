'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Product = {
  id: string
  code: string
  name: string
  category: string | null
  unit: string
  base_price: number
  vat_rate: number
  status: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ code: '', name: '', category: '', unit: 'Koli', base_price: '', vat_rate: '20' })
  const supabase = createClient()

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase.from('product').select('*').order('code')
    setProducts(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.code || !form.name || !form.base_price) return
    if (editing) {
      await supabase.from('product').update({
        code: form.code, name: form.name, category: form.category,
        unit: form.unit, base_price: parseFloat(form.base_price),
        vat_rate: parseFloat(form.vat_rate), updated_at: new Date().toISOString()
      }).eq('id', editing.id)
    } else {
      await supabase.from('product').insert({
        code: form.code, name: form.name, category: form.category,
        unit: form.unit, base_price: parseFloat(form.base_price),
        vat_rate: parseFloat(form.vat_rate),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
    }
    setShowForm(false)
    setEditing(null)
    setForm({ code: '', name: '', category: '', unit: 'Koli', base_price: '', vat_rate: '20' })
    loadProducts()
  }

  function handleEdit(p: Product) {
    setEditing(p)
    setForm({ code: p.code, name: p.name, category: p.category || '', unit: p.unit, base_price: String(p.base_price), vat_rate: String(p.vat_rate) })
    setShowForm(true)
  }

  async function handleToggleStatus(p: Product) {
    await supabase.from('product').update({
      status: p.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE',
      updated_at: new Date().toISOString()
    }).eq('id', p.id)
    loadProducts()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a' }}>Ürünler</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ code: '', name: '', category: '', unit: 'Koli', base_price: '', vat_rate: '20' }) }}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          + Yeni Ürün
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>{editing ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Kod', key: 'code', placeholder: 'PRD-001' },
              { label: 'Ürün Adı', key: 'name', placeholder: 'Deterjan 5L' },
              { label: 'Kategori', key: 'category', placeholder: 'Temizlik' },
              { label: 'Birim', key: 'unit', placeholder: 'Koli' },
              { label: 'Taban Fiyat (TL)', key: 'base_price', placeholder: '245', type: 'number' },
              { label: 'KDV (%)', key: 'vat_rate', placeholder: '20', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setEditing(null) }} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: 'white' }}>İptal</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Kaydet</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <p style={{ padding: '20px', fontSize: '13px', color: '#94a3b8' }}>Yükleniyor...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Kod', 'Ürün Adı', 'Kategori', 'Birim', 'Taban Fiyat', 'KDV', 'Durum', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Taban Fiyat' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Henüz ürün yok</td></tr>}
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{p.code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1a2332' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.category}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.unit}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#1e3a8a' }}>TL{Number(p.base_price).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>%{p.vat_rate}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', background: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: p.status === 'ACTIVE' ? '#14532d' : '#475569' }}>
                      {p.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleEdit(p)} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' }}>Düzenle</button>
                    <button onClick={() => handleToggleStatus(p)} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                      {p.status === 'ACTIVE' ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
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