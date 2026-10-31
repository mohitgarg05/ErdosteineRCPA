import connectToDatabase from './db';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Brand from '@/models/Brand';
import { hashPassword } from './auth';

export async function ensureInitialSeed() {
  await connectToDatabase();

  // 1. Seed Admin
  const adminExists = await User.findOne({ email: 'admin@erdosteine.com' });
  if (!adminExists) {
    const hashedPassword = await hashPassword('admin123');
    await User.create({
      name: 'System Administrator',
      email: 'admin@erdosteine.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9999999999',
      employeeId: 'ADM-001',
    });
  }

  // 2. Seed Sample MRs
  const mrExists = await User.findOne({ email: 'mr@erdosteine.com' });
  if (!mrExists) {
    const hashedPassword = await hashPassword('mr123');
    await User.create({
      name: 'Rajesh Sharma',
      email: 'mr@erdosteine.com',
      password: hashedPassword,
      role: 'mr',
      phone: '9876543210',
      employeeId: 'MR-101',
    });
  }

  const mr2Exists = await User.findOne({ email: 'mr2@erdosteine.com' });
  if (!mr2Exists) {
    const hashedPassword = await hashPassword('mr123');
    await User.create({
      name: 'Priya Patel',
      email: 'mr2@erdosteine.com',
      password: hashedPassword,
      role: 'mr',
      phone: '9876543222',
      employeeId: 'MR-102',
    });
  }

  // 3. Seed Default Brands
  const brandCount = await Brand.countDocuments();
  if (brandCount === 0) {
    await Brand.insertMany([
      { name: 'Erdosteine 300mg Capsules', isOwnProduct: true, isActive: true },
      { name: 'Erdosteine 175mg/5ml Suspension', isOwnProduct: true, isActive: true },
      { name: 'N-Acetylcysteine 600mg (NAC)', isOwnProduct: false, isActive: true },
      { name: 'Acebrophylline 100mg', isOwnProduct: false, isActive: true },
      { name: 'Ambroxol + Levosalbutamol', isOwnProduct: false, isActive: true },
      { name: 'Montelukast + Levocetirizine', isOwnProduct: false, isActive: true },
    ]);
  }

  // 4. Seed Sample Doctors if empty
  const doctorCount = await Doctor.countDocuments();
  if (doctorCount === 0) {
    await Doctor.insertMany([
      {
        name: 'Dr. A. K. Sharma',
        specialty: 'Pulmonology / Chest',
        clinicHospital: 'Metro Chest Hospital',
        cityLocation: 'New Delhi - South',
        phone: '9811223344',
      },
      {
        name: 'Dr. Sneha Reddy',
        specialty: 'General Medicine',
        clinicHospital: 'Apollo Clinic',
        cityLocation: 'New Delhi - Central',
        phone: '9811223355',
      },
      {
        name: 'Dr. Vikram Verma',
        specialty: 'Pulmonologist',
        clinicHospital: 'Fortis Hospital',
        cityLocation: 'Noida - Sector 62',
        phone: '9811223366',
      },
      {
        name: 'Dr. Meera Nair',
        specialty: 'Internal Medicine',
        clinicHospital: 'Max Healthcare',
        cityLocation: 'Gurgaon - Sector 44',
        phone: '9811223377',
      },
      {
        name: 'Dr. Rajesh Kulkarni',
        specialty: 'Chest Physician',
        clinicHospital: 'City Care Hospital',
        cityLocation: 'Mumbai - Andheri West',
        phone: '9811223388',
      },
    ]);
  }
}
