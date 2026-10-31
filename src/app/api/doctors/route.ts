import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Doctor from '@/models/Doctor';
import { getSession } from '@/lib/auth';
import { ensureInitialSeed } from '@/lib/seed';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await ensureInitialSeed();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    let filter = {};
    if (query) {
      const regex = new RegExp(query, 'i');
      filter = {
        $or: [
          { name: regex },
          { specialty: regex },
          { clinicHospital: regex },
          { cityLocation: regex },
        ],
      };
    }

    const doctors = await Doctor.find(filter)
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error: unknown) {
    console.error('Fetch doctors error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, specialty, clinicHospital, cityLocation, phone } = body;

    if (!name || !specialty || !clinicHospital || !cityLocation) {
      return NextResponse.json(
        { error: 'Name, Specialty, Clinic/Hospital, and Location are required' },
        { status: 400 }
      );
    }

    const doctor = await Doctor.create({
      name: name.trim(),
      specialty: specialty.trim(),
      clinicHospital: clinicHospital.trim(),
      cityLocation: cityLocation.trim(),
      phone: phone?.trim() || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor added successfully',
      doctor,
    });
  } catch (error: unknown) {
    console.error('Create doctor error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
