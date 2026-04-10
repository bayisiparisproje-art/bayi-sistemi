import { createClient } from '@/lib/supabase'

export type PriceResult = {
  base_price: number
  discount_rate: number
  discount_source: 'OVERRIDE' | 'GROUP' | 'NONE'
  unit_price: number
  vat_rate: number
  line_total: number
  line_total_with_vat: number
}

export async function calculatePrice(
  dealerId: string,
  productId: string,
  quantity: number
): Promise<PriceResult> {
  const supabase = createClient()

  // Ürün bilgisi
  const { data: product } = await supabase
    .from('product')
    .select('base_price, vat_rate')
    .eq('id', productId)
    .single()

  if (!product) throw new Error('Ürün bulunamadı')

  const base_price = Number(product.base_price)
  const vat_rate = Number(product.vat_rate)

  // Bayi özel indirimi var mı?
  const { data: override } = await supabase
    .from('dealer_price_override')
    .select('discount_rate')
    .eq('dealer_id', dealerId)
    .eq('product_id', productId)
    .single()

  if (override) {
    const discount_rate = Number(override.discount_rate)
    const unit_price = base_price * (1 - discount_rate / 100)
    const line_total = unit_price * quantity
    const line_total_with_vat = line_total * (1 + vat_rate / 100)
    return { base_price, discount_rate, discount_source: 'OVERRIDE', unit_price, vat_rate, line_total, line_total_with_vat }
  }

  // Grup indirimi var mı?
  const { data: dealer } = await supabase
    .from('dealer')
    .select('price_group_id')
    .eq('id', dealerId)
    .single()

  if (dealer?.price_group_id) {
    const { data: groupRate } = await supabase
      .from('price_group_rate')
      .select('discount_rate')
      .eq('price_group_id', dealer.price_group_id)
      .eq('product_id', productId)
      .single()

    if (groupRate) {
      const discount_rate = Number(groupRate.discount_rate)
      const unit_price = base_price * (1 - discount_rate / 100)
      const line_total = unit_price * quantity
      const line_total_with_vat = line_total * (1 + vat_rate / 100)
      return { base_price, discount_rate, discount_source: 'GROUP', unit_price, vat_rate, line_total, line_total_with_vat }
    }
  }

  // İndirim yok
  const unit_price = base_price
  const line_total = unit_price * quantity
  const line_total_with_vat = line_total * (1 + vat_rate / 100)
  return { base_price, discount_rate: 0, discount_source: 'NONE', unit_price, vat_rate, line_total, line_total_with_vat }
}