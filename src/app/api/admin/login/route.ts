import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ADMIN_TOKEN = 'btc-admin-2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const admin = await db.adminAuth.findUnique({
      where: { username: String(username) },
    })

    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      token: ADMIN_TOKEN,
      admin: { id: admin.id, username: admin.username },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
