import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, code, name, phone, region, payment_terms, price_group_id } = body

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Auth hatası' }, { status: 400 })
  }

  const { error: userError } = await supabase.from('user').insert({
    id: authData.user.id, email, role: 'DEALER',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  })

  if (userError) {
    return NextResponse.json({ error: 'User kaydı hatası: ' + userError.message }, { status: 400 })
  }

  const { error: dealerError } = await supabase.from('dealer').insert({
    code, name, email,
    phone: phone || null,
    region: region || null,
    payment_terms: payment_terms || 30,
    price_group_id: price_group_id || null,
    user_id: authData.user.id,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (dealerError) {
    return NextResponse.json({ error: 'Dealer kaydı hatası: ' + dealerError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}