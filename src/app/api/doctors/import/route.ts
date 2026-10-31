import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Doctor from '@/models/Doctor';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read workbook with xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: 'The uploaded file contains no sheets' }, { status: 400 });
    }

    const sheet = workbook.Sheets[firstSheetName];
    // Convert to JSON objects
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'The uploaded sheet is empty' }, { status: 400 });
    }

    let insertedCount = 0;
    const skippedRows: Array<{ rowNumber: number; reason: string }> = [];

    const doctorsToInsert = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Helper to find key case-insensitively
      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          const found = Object.keys(row).find((rk) => rk.toLowerCase().replace(/[^a-z]/g, '') === k.toLowerCase().replace(/[^a-z]/g, ''));
          if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
            return String(row[found]).trim();
          }
        }
        return '';
      };

      const name = getVal('name', 'doctorname', 'doctor');
      const specialty = getVal('specialty', 'speciality', 'dept', 'department');
      const clinicHospital = getVal('clinichospital', 'hospital', 'clinic', 'hospitalclinic', 'workplace');
      const cityLocation = getVal('citylocation', 'location', 'city', 'area', 'territory');
      const phone = getVal('phone', 'mobile', 'contact', 'telephone');

      if (!name || !specialty || !clinicHospital || !cityLocation) {
        skippedRows.push({
          rowNumber: i + 2, // 1-based index + header
          reason: `Missing required field(s): ${[!name && 'Name', !specialty && 'Specialty', !clinicHospital && 'Clinic/Hospital', !cityLocation && 'Location'].filter(Boolean).join(', ')}`,
        });
        continue;
      }

      doctorsToInsert.push({
        name,
        specialty,
        clinicHospital,
        cityLocation,
        phone,
      });
    }

    if (doctorsToInsert.length > 0) {
      const result = await Doctor.insertMany(doctorsToInsert, { ordered: false });
      insertedCount = result.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} doctors`,
      insertedCount,
      skippedCount: skippedRows.length,
      skippedRows: skippedRows.slice(0, 10), // return first 10 skipped details
    });
  } catch (error: unknown) {
    console.error('Doctor import error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process file import' },
      { status: 500 }
    );
  }
}
