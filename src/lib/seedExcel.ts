import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import DoctorMapping from '@/models/DoctorMapping';

export async function seedFromExcel(force: boolean = false) {
  if (!force) {
    const [existingDoctors, existingUsers, existingMappings] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'mr' }),
      DoctorMapping.countDocuments(),
    ]);

    if (existingUsers >= 300 && existingDoctors >= 10000 && existingMappings >= 10000) {
      console.log('[seedFromExcel] Database is already populated. Skipping re-insertion.');
      return {
        success: true,
        alreadySeeded: true,
        employeesCount: existingUsers,
        doctorsCount: existingDoctors,
        mappingsCount: existingMappings,
      };
    }
  }

  const filePath = path.join(process.cwd(), 'Book1.xlsx');
  if (!fs.existsSync(filePath)) {
    console.warn(`[seedFromExcel] File not found at: ${filePath}`);
    return { success: false, message: 'Book1.xlsx not found' };
  }

  console.log('[seedFromExcel] Reading Book1.xlsx...');
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  console.log(`[seedFromExcel] Total rows parsed: ${rows.length}`);

  const employeesMap = new Map<string, {
    employeeId: string;
    name: string;
    location: string;
    region: string;
    role: 'mr';
    email: string;
  }>();

  const doctorsMap = new Map<string, {
    name: string;
    specialty: string;
    cityLocation: string;
    clinicHospital: string;
    region: string;
    legacyCode: string;
    pcode?: string;
    assignedEmployeeIds: string[];
  }>();

  const mappingsList: Array<{
    employeeId: string;
    legacyCode: string;
    doctorName: string;
    specialty: string;
    location: string;
    region: string;
    pcode: string;
  }> = [];

  const seenMappingKeys = new Set<string>();

  for (const r of rows) {
    const empIdRaw = r['EMP-ID'];
    if (!empIdRaw || String(empIdRaw).toLowerCase().includes('vacant')) {
      continue;
    }

    const empId = String(empIdRaw).replace(/\.0$/, '').trim();
    const empName = String(r['EMP_NAME'] || '').trim() || `MR ${empId}`;
    const location = String(r['LOCATION'] || '').trim();
    const region = String(r['Region'] || '').trim();
    const drName = String(r['Dr Name'] || '').trim();
    const specialty = String(r['Cipla Speciality'] || 'General').trim();
    const legacyCode = String(r['LEGACY_CODE'] || '').trim();
    const pcode = String(r['PCODE'] || '').replace(/\.0$/, '').trim();

    // 1. Employee
    if (!employeesMap.has(empId)) {
      employeesMap.set(empId, {
        employeeId: empId,
        name: empName,
        location,
        region,
        role: 'mr',
        email: `${empId}@cipla.mr`,
      });
    }

    // 2. Doctor
    const docKey = legacyCode || drName;
    if (!doctorsMap.has(docKey)) {
      doctorsMap.set(docKey, {
        name: drName || 'Unnamed Doctor',
        specialty,
        cityLocation: location,
        clinicHospital: location,
        region,
        legacyCode,
        pcode,
        assignedEmployeeIds: [empId],
      });
    } else {
      const existing = doctorsMap.get(docKey)!;
      if (!existing.assignedEmployeeIds.includes(empId)) {
        existing.assignedEmployeeIds.push(empId);
      }
    }

    // 3. Mapping
    const mapKey = `${empId}_${legacyCode || drName}`;
    if (!seenMappingKeys.has(mapKey)) {
      seenMappingKeys.add(mapKey);
      mappingsList.push({
        employeeId: empId,
        legacyCode,
        doctorName: drName,
        specialty,
        location,
        region,
        pcode,
      });
    }
  }

  console.log(`[seedFromExcel] Unique Employees to upsert: ${employeesMap.size}`);
  console.log(`[seedFromExcel] Unique Doctors to upsert: ${doctorsMap.size}`);
  console.log(`[seedFromExcel] Unique Mappings to insert: ${mappingsList.length}`);

  // Bulk upsert employees
  const userOps = Array.from(employeesMap.values()).map((emp) => ({
    updateOne: {
      filter: { employeeId: emp.employeeId },
      update: {
        $set: {
          name: emp.name,
          employeeId: emp.employeeId,
          role: emp.role,
          location: emp.location,
          region: emp.region,
          email: emp.email,
        },
      },
      upsert: true,
    },
  }));
  if (userOps.length > 0) {
    await User.bulkWrite(userOps, { ordered: false });
  }

  // Bulk upsert doctors in batches of 1000
  const doctorOps = Array.from(doctorsMap.values()).map((doc) => ({
    updateOne: {
      filter: doc.legacyCode ? { legacyCode: doc.legacyCode } : { name: doc.name, cityLocation: doc.cityLocation },
      update: {
        $set: {
          name: doc.name,
          specialty: doc.specialty,
          cityLocation: doc.cityLocation,
          clinicHospital: doc.clinicHospital,
          region: doc.region,
          legacyCode: doc.legacyCode,
          pcode: doc.pcode,
          assignedEmployeeIds: doc.assignedEmployeeIds,
        },
      },
      upsert: true,
    },
  }));

  const BATCH_SIZE = 1000;
  for (let i = 0; i < doctorOps.length; i += BATCH_SIZE) {
    const batch = doctorOps.slice(i, i + BATCH_SIZE);
    await Doctor.bulkWrite(batch, { ordered: false });
  }

  // Clear and bulk insert doctor mappings
  await DoctorMapping.deleteMany({});
  for (let i = 0; i < mappingsList.length; i += BATCH_SIZE) {
    const batch = mappingsList.slice(i, i + BATCH_SIZE);
    await DoctorMapping.insertMany(batch, { ordered: false });
  }

  console.log('[seedFromExcel] Completed seeding successfully!');
  return {
    success: true,
    employeesCount: employeesMap.size,
    doctorsCount: doctorsMap.size,
    mappingsCount: mappingsList.length,
  };
}
