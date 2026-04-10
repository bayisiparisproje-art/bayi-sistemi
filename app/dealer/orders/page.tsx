'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Order = {
  id: string
  order_no: string
  order_date: string
  status: string
  total: number
  note: string | null
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [items, setItems] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: dealer } = await supabase.from('dealer').select('id').eq('user_id', user.id).single()
    if (!dealer) return
    const { data } = await supabase.from('order').select('*').eq('dealer_id', dealer.id).order('order_date', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function handleSelect(order: Order) {
    setSelected(order)
    const { data } = await supabase.from('order_item').select('*, product(name, code)').eq('order_id', order.id)
    setItems(data || [])
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Onay Bekliyor', CONFIRMED: 'Onaylandı', PROCESSING: 'Hazırlanıyor',
    SHIPPED: 'Kargoda', DELIVERED: 'Teslim Edildi', CANCELLED: 'İptal'
  }
  const statusColor: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    CONFIRMED: { bg: '#dbeafe', color: '#1e40af' },
    PROCESSING: { bg: '#ede9fe', color: '#4c1d95' },
    SHIPPED: { bg: '#e0f2fe', color: '#0c4a6e' },
    DELIVERED: { bg: '#dcfce7', color: '#14532d' },
    CANCELLED: { bg: '#fee2e2', color: '#7f1d1d' },
  }

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '20px' }}>Siparişlerim</h1>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <p style={{ padding: '20px', fontSize: '13px', color: '#94a3b8' }}>Yükleniyor...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Sipariş No', 'Tarih', 'Tutar', 'Durum'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Tutar' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Henüz sipariş yok</td></tr>}
                {orders.map((o, i) => (
                  <tr key={o.id} onClick={() => handleSelect(o)} style={{
                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                    background: selected?.id === o.id ? '#eff6ff' : i % 2 === 0 ? 'white' : '#fafbfc'
                  }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{o.order_no}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(o.order_date).toLocaleDateString('tr-TR')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#1e3a8a' }}>TL{Number(o.total).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', background: statusColor[o.status]?.bg, color: statusColor[o.status]?.color }}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div style={{ width: '280px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '20px' }}>Detay</h2>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Sipariş No</p>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>{selected.order_no}</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Tarih</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{new Date(selected.order_date).toLocaleDateString('tr-TR')}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Durum</p>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: '600', background: statusColor[selected.status]?.bg, color: statusColor[selected.status]?.color }}>
                {statusLabel[selected.status] || selected.status}
              </span>
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Kalemler</p>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{i.product?.name} x{i.quantity}</span>
                  <span style={{ fontWeight: '500', color: '#1a2332' }}>TL{Number(i.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>
                <span>Toplam</span><span>TL{Number(selected.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}