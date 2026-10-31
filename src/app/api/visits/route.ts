import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Visit from '@/models/Visit';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { doctorId, visitDate, brands, remarks } = body;

    if (!doctorId) {
      return NextResponse.json({ error: 'Please select a doctor' }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Selected doctor not found' }, { status: 404 });
    }

    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return NextResponse.json({ error: 'At least one brand/unit entry is required' }, { status: 400 });
    }

    if (brands.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 brand/unit entries allowed per visit' }, { status: 400 });
    }

    // Validate brand rows
    const cleanedBrands = [];
    for (const item of brands) {
      const brandName = item.brandName?.trim();
      const units = Number(item.units);
      if (!brandName) {
        return NextResponse.json({ error: 'Brand name is required for all entries' }, { status: 400 });
      }
      if (isNaN(units) || units <= 0) {
        return NextResponse.json({ error: `Units for "${brandName}" must be a positive number` }, { status: 400 });
      }
      cleanedBrands.push({ brandName, units });
    }

    const visit = await Visit.create({
      mr: new mongoose.Types.ObjectId(session.userId),
      doctor: new mongoose.Types.ObjectId(doctorId),
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      brands: cleanedBrands,
      remarks: remarks?.trim() || '',
    });

    const populatedVisit = await Visit.findById(visit._id)
      .populate('mr', 'name email employeeId')
      .populate('doctor', 'name specialty clinicHospital cityLocation')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Doctor visit entry recorded successfully',
      visit: populatedVisit,
    });
  } catch (error: unknown) {
    console.error('Save visit error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save visit entry' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // Filter criteria
    const filter: Record<string, unknown> = {};

    // If MR, default to their own visits only
    if (session.role === 'mr') {
      filter.mr = new mongoose.Types.ObjectId(session.userId);
    } else if (session.role === 'admin') {
      const mrId = searchParams.get('mrId');
      if (mrId && mongoose.Types.ObjectId.isValid(mrId)) {
        filter.mr = new mongoose.Types.ObjectId(mrId);
      }
    }

    const doctorId = searchParams.get('doctorId');
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      filter.doctor = new mongoose.Types.ObjectId(doctorId);
    }

    const brandName = searchParams.get('brand')?.trim();
    if (brandName) {
      filter['brands.brandName'] = new RegExp(brandName, 'i');
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.visitDate = dateFilter;
    }

    // Ensure models are registered for populate
    void Doctor;
    void User;

    const visits = await Visit.find(filter)
      .sort({ visitDate: -1, createdAt: -1 })
      .populate('mr', 'name email employeeId phone')
      .populate('doctor', 'name specialty clinicHospital cityLocation phone')
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error: unknown) {
    console.error('Fetch visits error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}
