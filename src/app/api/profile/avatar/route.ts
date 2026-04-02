import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const file = formData.get('avatar') as File;

    if (!userId || !file) {
      return NextResponse.json({ error: 'User ID and avatar file are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'avatars');
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadDir, { recursive: true });

    await writeFile(filePath, buffer);

    const avatarUrl = `/avatars/${fileName}`;

    await db.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
