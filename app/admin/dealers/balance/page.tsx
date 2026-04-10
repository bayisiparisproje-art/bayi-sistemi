'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Order = {
  id: string
  order_no: string
  order_date: string
  status: string
  total: number
}

type Payment = {
  id: string
  amount: number
  payment_date: string
  method: string
  reference: string | null
  note: string | null
}

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
      supabase.from('order').select('id, order_no, order_date, status, total')
        .eq('dealer_id', dealer.id)
        .neq('status', 'CANCELLED')
        .order('order_date', { ascending: false }),
      supabase.from('payment').select('*')
        .eq('dealer_id', dealer.id)
        .order('payment_date', { ascending: false }),
    ])
    setOrders(o.data || [])
    setPayments(p.data || [])
    setLoading(false)
  }

  const totalOrders = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = totalOrders - totalPayments

  const methodLabel: Record<string, string> = {
    BANK_TRANSFER: 'Havale/EFT', CHECK: 'Çek', CASH: 'Nakit', OTHER: 'Diğer'
  }

  type Entry = {
    date: string
    type: 'order' | 'payment'
    description: string
    debit: number | null
    credit: number | null
    id: string
  }

  const entries: Entry[] = [
    ...orders.map(o => ({
      date: o.order_date,
      type: 'order' as const,
      description: 'Siparis ' + o.order_no,
      debit: Number(o.total),
      credit: null,
      id: o.id,
    })),
    ...payments.map(p => ({
      date: p.payment_date,
      type: 'payment' as const,
      description: 'Odeme' + (p.reference ? ' - ' + p.reference : ''),
      debit: null,
      credit: Number(p.amount),
      id: p.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <h1 className="text-lg font-medium mb-5">Bakiyem</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Toplam Alım</p>
          <p className="text-xl font-medium">TL{totalOrders.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Ödenen</p>
          <p className="text-xl font-medium text-green-600">TL{totalPayments.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Bakiye (Borç)</p>
          <p className={'text-xl font-medium ' + (balance > 0 ? 'text-amber-600' : 'text-green-600')}>
            TL{balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Tarih</th>
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Açıklama</th>
            <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Borç</th>
            <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Alacak</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>}
            {!loading && entries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Kayıt yok</td></tr>}
            {entries.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-3">{e.description}</td>
                <td className="px-4 py-3 text-right text-red-500">{e.debit ? 'TL' + e.debit.toFixed(2) : '—'}</td>
                <td className="px-4 py-3 text-right text-green-600">{e.credit ? 'TL' + e.credit.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}