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
      location?: string;
      phone?: string;
    }

    interface PopulatedDoctor {
      name?: string;
      specialty?: string;
      clinicHospital?: string;
      cityLocation?: string;
      legacyCode?: string;
      phone?: string;
    }

    const visits = await Visit.find(filter)
      .sort({ visitDate: -1 })
      .populate('mr', 'name email employeeId location phone')
      .populate('doctor', 'name specialty clinicHospital cityLocation legacyCode phone')
      .lean();

    // Flatten into export rows: row per brand entry or comprehensive visit row
    const exportRows = visits.flatMap((v) => {
      const mr = (v.mr as PopulatedMR) || {};
      const doc = (v.doctor as PopulatedDoctor) || {};
      const entryDateStr = v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '';
      const brandsSummary = v.brands.map((b) => `${b.brandName} (${b.units} units)`).join('; ');

      // Each brand as an entry for easy pivot tables & analytics
      return v.brands.map((b, idx) => ({
        'Entry Date': entryDateStr,
        'Employee ID': mr.employeeId || 'N/A',
        'Employee Name': mr.name || 'N/A',
        'Employee Territory': mr.location || 'N/A',
        'Doctor Code': doc.legacyCode || 'N/A',
        'Doctor Name': doc.name || 'N/A',
        'Specialty': doc.specialty || 'N/A',
        'Doctor Location': doc.cityLocation || doc.clinicHospital || 'N/A',
        'Brand Reported': b.brandName,
        'Units Reported': b.units,
        'Brand Item #': `${idx + 1} of ${v.brands.length}`,
        'All Brands In Entry': brandsSummary,
        'Remarks / Feedback': v.remarks || '',
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erdosteine RCPA Entries');

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
