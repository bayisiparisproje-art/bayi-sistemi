'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type DealerSummary = {
  id: string
  code: string
  name: string
  region: string | null
  total_orders: number
  total_payments: number
  balance: number
  order_count: number
}

export default function AdminDashboard() {
  const [dealers, setDealers] = useState<DealerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: dealerList } = await supabase.from('dealer').select('id, code, name, region').eq('status', 'ACTIVE')
    if (!dealerList) return

    const summaries: DealerSummary[] = []

    for (const dealer of dealerList) {
      const [orders, payments] = await Promise.all([
        supabase.from('order').select('total').eq('dealer_id', dealer.id).neq('status', 'CANCELLED'),
        supabase.from('payment').select('amount').eq('dealer_id', dealer.id),
      ])

      const totalOrders = (orders.data || []).reduce((s, o) => s + Number(o.total), 0)
      const totalPayments = (payments.data || []).reduce((s, p) => s + Number(p.amount), 0)

      summaries.push({
        ...dealer,
        total_orders: totalOrders,
        total_payments: totalPayments,
        balance: totalOrders - totalPayments,
        order_count: orders.data?.length || 0,
      })
    }

    setDealers(summaries)
    setTotalRevenue(summaries.reduce((s, d) => s + d.total_orders, 0))
    setTotalBalance(summaries.reduce((s, d) => s + d.balance, 0))
    setOrderCount(summaries.reduce((s, d) => s + d.order_count, 0))
    setLoading(false)
  }

  async function handlePayment(dealerId: string, dealerName: string) {
    const amount = prompt(dealerName + ' icin odeme tutari (TL):')
    if (!amount || isNaN(parseFloat(amount))) return
    const reference = prompt('Dekont / Referans no (opsiyonel):')

    await supabase.from('payment').insert({
      dealer_id: dealerId,
      amount: parseFloat(amount),
      method: 'BANK_TRANSFER',
      reference: reference || null,
      payment_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    loadData()
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Toplam Ciro', value: 'TL' + totalRevenue.toFixed(2), color: '#1e3a8a' },
          { label: 'Toplam Bakiye', value: 'TL' + totalBalance.toFixed(2), color: '#d97706' },
          { label: 'Toplam Sipariş', value: String(orderCount), color: '#1e3a8a' },
          { label: 'Aktif Bayi', value: String(dealers.length), color: '#1e3a8a' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', borderTop: '3px solid ' + card.color }}>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '600', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Bayi bakiye özeti</h2>
        </div>
        {loading ? <p style={{ padding: '20px', fontSize: '13px', color: '#94a3b8' }}>Yükleniyor...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Bayi', 'Bölge', 'Sipariş', 'Toplam Alım', 'Ödenen', 'Bakiye', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Toplam Alım' || h === 'Ödenen' || h === 'Bakiye' ? 'right' : h === 'Sipariş' ? 'center' : 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dealers.length === 0 && <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Henüz veri yok</td></tr>}
              {dealers.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500', color: '#1a2332' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.code}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.region || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>{d.order_count}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#1a2332' }}>TL{d.total_orders.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#16a34a', fontWeight: '500' }}>TL{d.total_payments.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: d.balance > 0 ? '#d97706' : '#16a34a' }}>TL{d.balance.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handlePayment(d.id, d.name)} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                      Ödeme Al
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