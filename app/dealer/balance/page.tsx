'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Order = { id: string; order_no: string; order_date: string; status: string; total: number }
type Payment = { id: string; amount: number; payment_date: string; method: string; reference: string | null }

export default function BalancePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: dealer } = await supabase.from('dealer').select('id').eq('user_id', user.id).single()
    if (!dealer) return
    const [o, p] = await Promise.all([
      supabase.from('order').select('id, order_no, order_date, status, total').eq('dealer_id', dealer.id).neq('status', 'CANCELLED').order('order_date', { ascending: false }),
      supabase.from('payment').select('*').eq('dealer_id', dealer.id).order('payment_date', { ascending: false }),
    ])
    setOrders(o.data || [])
    setPayments(p.data || [])
    setLoading(false)
  }

  const totalOrders = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = totalOrders - totalPayments

  type Entry = { date: string; description: string; debit: number | null; credit: number | null; id: string }
  const entries: Entry[] = [
    ...orders.map(o => ({ date: o.order_date, description: 'Sipariş ' + o.order_no, debit: Number(o.total), credit: null, id: o.id })),
    ...payments.map(p => ({ date: p.payment_date, description: 'Ödeme' + (p.reference ? ' — ' + p.reference : ''), debit: null, credit: Number(p.amount), id: p.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '20px' }}>Bakiyem</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Toplam Alım', value: 'TL' + totalOrders.toFixed(2), color: '#1e3a8a', borderColor: '#1e3a8a' },
          { label: 'Ödenen', value: 'TL' + totalPayments.toFixed(2), color: '#16a34a', borderColor: '#16a34a' },
          { label: 'Bakiye (Borç)', value: 'TL' + balance.toFixed(2), color: balance > 0 ? '#d97706' : '#16a34a', borderColor: balance > 0 ? '#d97706' : '#16a34a' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '3px solid ' + card.borderColor, padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>Hesap hareketleri</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Tarih', 'Açıklama', 'Borç', 'Alacak'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: ['Borç', 'Alacak'].includes(h) ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Yükleniyor...</td></tr>}
            {!loading && entries.length === 0 && <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Kayıt yok</td></tr>}
            {entries.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(e.date).toLocaleDateString('tr-TR')}</td>
                <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1a2332' }}>{e.description}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#dc2626', fontWeight: '500' }}>{e.debit ? 'TL' + e.debit.toFixed(2) : '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>{e.credit ? 'TL' + e.credit.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}