import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Brand from '@/models/Brand';
import { getSession } from '@/lib/auth';
import { ensureInitialSeed } from '@/lib/seed';

export async function GET() {
  try {
    await connectToDatabase();
    await ensureInitialSeed();

    const brands = await Brand.find({ isActive: true }).sort({ isOwnProduct: -1, name: 1 }).lean();
    return NextResponse.json({ success: true, brands });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    const { name, isOwnProduct } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const brand = await Brand.create({
      name: name.trim(),
      isOwnProduct: Boolean(isOwnProduct),
      isActive: true,
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
