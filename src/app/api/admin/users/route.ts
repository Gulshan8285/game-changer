import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        forceLogoutAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    // Set forceLogoutAt to NOW — user will be kicked out on next poll
    // All their data stays intact, they just need to login again
    await db.user.update({
      where: { id: userId },
      data: { forceLogoutAt: new Date() },
    })

    return NextResponse.json({ success: true, message: 'User will be logged out. They need to login again.' })
  } catch (error: any) {
    console.error('Force logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to logout user: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
