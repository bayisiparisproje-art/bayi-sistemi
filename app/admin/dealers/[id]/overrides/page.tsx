'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type Product = {
  id: string
  code: string
  name: string
  base_price: number
}

type Override = {
  id: string
  product_id: string
  discount_rate: number
  note: string | null
}

type GroupRate = {
  product_id: string
  discount_rate: number
}

export default function OverridesPage() {
  const { id } = useParams()
  const [products, setProducts] = useState<Product[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [groupRates, setGroupRates] = useState<GroupRate[]>([])
  const [dealerName, setDealerName] = useState('')
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [d, p, o] = await Promise.all([
      supabase.from('dealer').select('name, price_group_id').eq('id', id).single(),
      supabase.from('product').select('id, code, name, base_price').eq('status', 'ACTIVE').order('code'),
      supabase.from('dealer_price_override').select('*').eq('dealer_id', id),
    ])
    setDealerName(d.data?.name || '')
    setProducts(p.data || [])
    setOverrides(o.data || [])

    if (d.data?.price_group_id) {
      const { data: rates } = await supabase
        .from('price_group_rate')
        .select('product_id, discount_rate')
        .eq('price_group_id', d.data.price_group_id)
      setGroupRates(rates || [])
    }
  }

  async function handleOverrideChange(productId: string, value: string) {
    const rate = parseFloat(value)
    if (isNaN(rate) || value === '') return
    const existing = overrides.find(o => o.product_id === productId)
    if (existing) {
      await supabase.from('dealer_price_override').update({ discount_rate: rate, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('dealer_price_override').insert({
        dealer_id: id, product_id: productId, discount_rate: rate,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
    }
    loadAll()
  }

  async function handleRemoveOverride(productId: string) {
    const existing = overrides.find(o => o.product_id === productId)
    if (existing) {
      await supabase.from('dealer_price_override').delete().eq('id', existing.id)
      loadAll()
    }
  }

  function getOverride(productId: string) {
    return overrides.find(o => o.product_id === productId)
  }

  function getGroupRate(productId: string) {
    return groupRates.find(r => r.product_id === productId)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <a href="/admin/dealers" className="text-sm text-gray-400 hover:text-gray-600">Bayiler</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-medium">{dealerName} — Özel İndirimler</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">Özel indirim girilmemiş ürünlerde grup indirimi uygulanır</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Ürün</th>
            <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Taban Fiyat</th>
            <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Grup İndirimi</th>
            <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Özel İndirim</th>
            <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Net Fiyat</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {products.map(p => {
              const ov = getOverride(p.id)
              const gr = getGroupRate(p.id)
              const appliedRate = ov ? ov.discount_rate : (gr ? gr.discount_rate : 0)
              const netPrice = Number(p.base_price) * (1 - appliedRate / 100)
              return (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.code}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">₺{Number(p.base_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {gr ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">%{gr.discount_rate}</span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        defaultValue={ov ? ov.discount_rate : ''}
                        placeholder="—"
                        min="0" max="100"
                        onBlur={e => handleOverrideChange(p.id, e.target.value)}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">
                    ₺{netPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ov && (
                      <button onClick={() => handleRemoveOverride(p.id)} className="text-xs text-red-400 hover:text-red-600">
                        Kaldır
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}