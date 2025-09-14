import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'email and newPassword required' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data: users, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
    const user = users.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase())
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unexpected_error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

