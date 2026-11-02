import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

// Helper to load env vars from .env.local or .env if not already set in process.env
function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erdosteine_rcpa';

async function run() {
  const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('Connecting to MongoDB at:', maskedUri);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const isForce = process.argv.includes('--force') || process.argv.includes('-f');

  // Check if database is already seeded
  const [existingDoctors, existingUsers, existingMappings] = await Promise.all([
    db.collection('doctors').countDocuments(),
    db.collection('users').countDocuments({ role: 'mr' }),
    db.collection('doctormappings').countDocuments(),
  ]);

  if (!isForce && existingUsers >= 300 && existingDoctors >= 10000 && existingMappings >= 10000) {
    console.log('\n✅ Database is already populated:');
    console.log(`   • Employees: ${existingUsers}`);
    console.log(`   • Doctors: ${existingDoctors}`);
    console.log(`   • Mappings: ${existingMappings}`);
    console.log('\nSkipping re-insertion. If you want to re-seed from scratch, run:\n   npm run seed -- --force\n');
    await mongoose.disconnect();
    return;
  }

  const filePath = path.resolve(process.cwd(), 'Book1.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  console.log('Reading Book1.xlsx...');
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Parsed ${rows.length} rows.`);

  const employeesMap = new Map();
  const doctorsMap = new Map();
  const mappingsList = [];
  const seenMapKeys = new Set();

  for (const r of rows) {
    const empIdRaw = r['EMP-ID'];
    if (!empIdRaw || String(empIdRaw).toLowerCase().includes('vacant')) continue;

    const empId = String(empIdRaw).replace(/\.0$/, '').trim();
    const empName = String(r['EMP_NAME'] || '').trim() || `MR ${empId}`;
    const location = String(r['LOCATION'] || '').trim();
    const region = String(r['Region'] || '').trim();
    const drName = String(r['Dr Name'] || '').trim();
    const specialty = String(r['Cipla Speciality'] || 'General').trim();
    const legacyCode = String(r['LEGACY_CODE'] || '').trim();
    const pcode = String(r['PCODE'] || '').replace(/\.0$/, '').trim();

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
      const existing = doctorsMap.get(docKey);
      if (!existing.assignedEmployeeIds.includes(empId)) {
        existing.assignedEmployeeIds.push(empId);
      }
    }

    const mapKey = `${empId}_${legacyCode || drName}`;
    if (!seenMapKeys.has(mapKey)) {
      seenMapKeys.add(mapKey);
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

  console.log(`Unique Employees: ${employeesMap.size}`);
  console.log(`Unique Doctors: ${doctorsMap.size}`);
  console.log(`Total Mappings: ${mappingsList.length}`);

  // 0. Admin User & Brands
  const adminHash = '$2b$10$oxZp9HO.QWzZo02hRHMkyO7lPeVt4EmEvVIj7KXzg.t/e0OjLDTky';
  const adminExists = await db.collection('users').findOne({ email: 'admin@erdosteine.com' });
  if (!adminExists) {
    console.log('Creating Admin user (admin@erdosteine.com)...');
    await db.collection('users').insertOne({
      name: 'System Administrator',
      email: 'admin@erdosteine.com',
      password: adminHash,
      role: 'admin',
      phone: '9999999999',
      employeeId: 'ADM-001',
      createdAt: new Date(),
    });
  } else {
    await db.collection('users').updateOne(
      { email: 'admin@erdosteine.com' },
      { $set: { password: adminHash } }
    );
  }

  // 1. Employees -> users collection
  console.log('Upserting users...');
  const userOps = Array.from(employeesMap.values()).map((emp) => ({
    updateOne: {
      filter: { employeeId: emp.employeeId },
      update: { $set: emp },
      upsert: true,
    },
  }));
  await db.collection('users').bulkWrite(userOps, { ordered: false });

  // 2. Doctors -> doctors collection
  console.log('Upserting doctors in batches of 1000...');
  const doctorOps = Array.from(doctorsMap.values()).map((doc) => ({
    updateOne: {
      filter: doc.legacyCode ? { legacyCode: doc.legacyCode } : { name: doc.name, cityLocation: doc.cityLocation },
      update: { $set: doc },
      upsert: true,
    },
  }));
  for (let i = 0; i < doctorOps.length; i += 1000) {
    const batch = doctorOps.slice(i, i + 1000);
    await db.collection('doctors').bulkWrite(batch, { ordered: false });
  }

  // 3. Mappings -> doctormappings collection
  console.log('Writing doctormappings collection...');
  await db.collection('doctormappings').deleteMany({});
  for (let i = 0; i < mappingsList.length; i += 1000) {
    const batch = mappingsList.slice(i, i + 1000);
    await db.collection('doctormappings').insertMany(batch, { ordered: false });
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
