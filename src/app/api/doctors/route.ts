import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Doctor from '@/models/Doctor';
import { getSession } from '@/lib/auth';
import { ensureInitialSeed } from '@/lib/seed';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await ensureInitialSeed();

    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const requestedEmpId = searchParams.get('employeeId')?.trim();
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const filterConditions: Record<string, unknown>[] = [];

    // Mapping Filter: If logged-in as MR, restrict strictly to their assigned doctors
    if (session && session.role === 'mr' && session.employeeId) {
      filterConditions.push({ assignedEmployeeIds: session.employeeId });
    } else if (requestedEmpId) {
      // If admin wants to view a specific employee's doctor list
      filterConditions.push({ assignedEmployeeIds: requestedEmpId });
    }

    if (query) {
      const regex = new RegExp(query, 'i');
      filterConditions.push({
        $or: [
          { name: regex },
          { specialty: regex },
          { clinicHospital: regex },
          { cityLocation: regex },
          { legacyCode: regex },
        ],
      });
    }

    const filter = filterConditions.length > 0 ? { $and: filterConditions } : {};

    const doctors = await Doctor.find(filter)
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: doctors.length,
      employeeId: session?.employeeId || requestedEmpId || null,
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
