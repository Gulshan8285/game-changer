import { NextRequest, NextResponse } from 'next/server'

const ADMIN_TOKEN = 'btc-admin-2024'

export function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_TOKEN
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Unauthorized. Invalid or missing admin token.' },
    { status: 401 }
  )
}
