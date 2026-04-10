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
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message }, { status: 400 })
  }

  await supabase.from('user').insert({
    id: authData.user.id,
    email,
    role: 'DEALER',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  await supabase.from('dealer').insert({
    code, name, email, phone: phone || null, region: region || null,
    payment_terms, price_group_id: price_group_id || null,
    user_id: authData.user.id, status: 'ACTIVE',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}