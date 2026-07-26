import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename: strip path traversal, special chars, whitespace
    const safeName = file.name
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/--+/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + safeName;
    
    // Ensure public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Write file to public/uploads
    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    // Return the URL
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
