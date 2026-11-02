import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { seedFromExcel } from '@/lib/seedExcel';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import DoctorMapping from '@/models/DoctorMapping';

export async function GET() {
  try {
    await connectToDatabase();

    const [activeMrCount, doctorCount, mappingCount] = await Promise.all([
      User.countDocuments({ role: 'mr' }),
      Doctor.countDocuments(),
      DoctorMapping.countDocuments(),
    ]);

    return NextResponse.json({
      status: 'ok',
      counts: {
        employees: activeMrCount,
        doctors: doctorCount,
        mappings: mappingCount,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to check seed status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    const result = await seedFromExcel();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to run seed' },
      { status: 500 }
    );
  }
}
