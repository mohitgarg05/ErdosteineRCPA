import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Visit from '@/models/Visit';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx'; // 'xlsx' or 'csv'

    const filter: Record<string, unknown> = {};

    const mrId = searchParams.get('mrId');
    if (mrId && mongoose.Types.ObjectId.isValid(mrId)) {
      filter.mr = new mongoose.Types.ObjectId(mrId);
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

    void Doctor;
    void User;

    interface PopulatedMR {
      name?: string;
      email?: string;
      employeeId?: string;
      phone?: string;
    }

    interface PopulatedDoctor {
      name?: string;
      specialty?: string;
      clinicHospital?: string;
      cityLocation?: string;
      phone?: string;
    }

    const visits = await Visit.find(filter)
      .sort({ visitDate: -1 })
      .populate('mr', 'name email employeeId phone')
      .populate('doctor', 'name specialty clinicHospital cityLocation phone')
      .lean();

    // Flatten into export rows: row per brand entry or comprehensive visit row
    const exportRows = visits.flatMap((v) => {
      const mr = (v.mr as PopulatedMR) || {};
      const doc = (v.doctor as PopulatedDoctor) || {};
      const visitDateStr = v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '';
      const brandsSummary = v.brands.map((b) => `${b.brandName} (${b.units} units)`).join('; ');

      // Each brand as an entry for easy pivot tables & analytics
      return v.brands.map((b, idx) => ({
        'Visit ID': v._id.toString(),
        'Visit Date': visitDateStr,
        'MR Name': mr.name || 'N/A',
        'MR Email': mr.email || 'N/A',
        'MR Employee ID': mr.employeeId || 'N/A',
        'Doctor Name': doc.name || 'N/A',
        'Specialty': doc.specialty || 'N/A',
        'Clinic / Hospital': doc.clinicHospital || 'N/A',
        'City / Location': doc.cityLocation || 'N/A',
        'Doctor Phone': doc.phone || 'N/A',
        'Brand Promoted': b.brandName,
        'Units Reported': b.units,
        'Brand Entry #': `${idx + 1} of ${v.brands.length}`,
        'All Brands In Visit': brandsSummary,
        'Remarks / Feedback': v.remarks || '',
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erdosteine RCPA Visits');

    const dateTag = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Erdosteine_RCPA_Visits_${dateTag}.csv"`,
        },
      });
    }

    // Default to XLSX
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Erdosteine_RCPA_Visits_${dateTag}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to export visit data' },
      { status: 500 }
    );
  }
}
