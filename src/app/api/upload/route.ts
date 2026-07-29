import { NextRequest, NextResponse } from 'next/server';
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

    // Sanitize filename
    const safeName = file.name
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/--+/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + safeName;

    // Upload to Supabase Storage via REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // Cloud mode: Upload to Supabase Storage
      const storageUrl = `${supabaseUrl}/storage/v1/object/product-images/${filename}`;
      const uploadRes = await fetch(storageUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Supabase upload error:', errorText);
        return NextResponse.json(
          { success: false, error: 'Failed to upload image to storage' },
          { status: 500 }
        );
      }

      // Return the public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } else {
      // Local fallback: write to disk (for local development only)
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync, mkdirSync } = await import('fs');

      const uploadDir = join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      const path = join(uploadDir, filename);
      await writeFile(path, buffer);

      return NextResponse.json({ success: true, url: `/uploads/${filename}` });
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
