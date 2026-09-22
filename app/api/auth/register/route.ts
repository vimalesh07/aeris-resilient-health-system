import dns from 'node:dns'
dns.setDefaultResultOrder('ipv4first')

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const VALID_ROLES = ['user', 'admin', 'government'] as const
type ValidRole = (typeof VALID_ROLES)[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, fullName, phone, role } = body as {
      email: string
      password: string
      fullName: string
      phone?: string
      role: string
    }

    // --- Input validation ---
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try {
              toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )

    // Sign up — the updated DB trigger will read 'role' from user_metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role as ValidRole,          // trigger reads this and sets profiles.role
          ...(phone ? { phone } : {}),
        },
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        sessionReady: !!data.session,
        message: `Account created as ${role.toUpperCase()}.`,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('[register] unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 })
  }
}
