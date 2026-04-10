'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { calculatePrice } from '@/lib/pricing'

type Product = { id: string; code: string; name: string }
type OrderItem = {
  product_id: string; product_name: string; quantity: number
  discount_rate: number; discount_source: string; unit_price: number
  vat_rate: number; line_total: number; line_total_with_vat: number
}

export default function NewOrderPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [dealerId, setDealerId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: dealer } = await supabase.from('dealer').select('id').eq('user_id', user.id).single()
    if (dealer) setDealerId(dealer.id)
    const { data: prods } = await supabase.from('product').select('id, code, name').eq('status', 'ACTIVE').order('code')
    setProducts(prods || [])
  }

  async function handleAddItem() {
    if (!selectedProduct || !dealerId) return
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    const price = await calculatePrice(dealerId, selectedProduct, quantity)
    const existing = items.findIndex(i => i.product_id === selectedProduct)
    if (existing >= 0) {
      const updated = [...items]
      const q = updated[existing].quantity + quantity
      updated[existing] = { ...updated[existing], quantity: q, line_total: updated[existing].unit_price * q, line_total_with_vat: updated[existing].unit_price * q * (1 + updated[existing].vat_rate / 100) }
      setItems(updated)
    } else {
      setItems([...items, { product_id: selectedProduct, product_name: product.name, quantity, discount_rate: price.discount_rate, discount_source: price.discount_source, unit_price: price.unit_price, vat_rate: price.vat_rate, line_total: price.line_total, line_total_with_vat: price.line_total_with_vat }])
    }
    setSelectedProduct('')
    setQuantity(1)
  }

  function handleRemoveItem(productId: string) { setItems(items.filter(i => i.product_id !== productId)) }

  const subtotal = items.reduce((s, i) => s + i.line_total, 0)
  const vatTotal = items.reduce((s, i) => s + (i.line_total_with_vat - i.line_total), 0)
  const total = subtotal + vatTotal

  async function handleSubmit() {
    if (items.length === 0 || !dealerId) return
    setLoading(true)
    const orderNo = 'ORD-' + Date.now()
    const { data: order, error } = await supabase.from('order').insert({
      order_no: orderNo, dealer_id: dealerId, status: 'PENDING',
      order_date: new Date().toISOString(), note: note || null,
      subtotal, vat_amount: vatTotal, total,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select().single()
    if (error || !order) { alert('Sipariş oluşturulamadı'); setLoading(false); return }
    await supabase.from('order_item').insert(items.map(i => ({
      order_id: order.id, product_id: i.product_id, quantity: i.quantity,
      base_price: i.unit_price / (1 - i.discount_rate / 100),
      discount_rate: i.discount_rate, discount_source: i.discount_source,
      unit_price: i.unit_price, vat_rate: i.vat_rate,
      line_total: i.line_total, line_total_with_vat: i.line_total_with_vat,
    })))
    alert('Sipariş ' + orderNo + ' basariyla gonderildi!')
    setItems([])
    setNote('')
    setLoading(false)
  }

  const selectStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none', background: 'white' }
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none' }

  return (
    <div>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '20px' }}>Yeni Sipariş</h1>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginBottom: '16px' }}>Ürün Ekle</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Ürün</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={selectStyle}>
              <option value="">— Seçin —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Miktar</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} style={inputStyle} />
          </div>
          <button onClick={handleAddItem} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Ekle
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Ürün', 'Miktar', 'Liste Fiyatı', 'İndirim', 'Net Fiyat', 'Toplam', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: ['Liste Fiyatı', 'Net Fiyat', 'Toplam'].includes(h) ? 'right' : h === 'İndirim' || h === 'Miktar' ? 'center' : 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.product_id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1a2332' }}>{item.product_name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8', textDecoration: 'line-through' }}>
                    TL{(item.unit_price / (1 - item.discount_rate / 100)).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', background: '#dcfce7', color: '#14532d' }}>%{item.discount_rate}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#2563eb' }}>TL{item.unit_price.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#1e3a8a' }}>TL{item.line_total.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleRemoveItem(item.product_id)} style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}>Kaldır</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '32px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Ara toplam: <strong style={{ color: '#1a2332' }}>TL{subtotal.toFixed(2)}</strong></span>
            <span style={{ color: '#64748b' }}>KDV: <strong style={{ color: '#1a2332' }}>TL{vatTotal.toFixed(2)}</strong></span>
            <span style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '14px' }}>Toplam: TL{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Not (opsiyonel)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1a2332', outline: 'none', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={loading} style={{ padding: '11px 28px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Gönderiliyor...' : 'Siparişi Gönder'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}