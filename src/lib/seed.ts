import connectToDatabase from './db';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Brand from '@/models/Brand';
import { hashPassword } from './auth';
import { seedFromExcel } from './seedExcel';

export async function ensureInitialSeed() {
  await connectToDatabase();

  // 1. Seed or Update Admin User
  const hashedPassword = await hashPassword('Erdosteine!2026--');
  const admin = await User.findOne({ email: 'admin@erdosteine.com' });
  if (!admin) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@erdosteine.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9999999999',
      employeeId: 'ADM-001',
    });
  } else {
    // Keep password synchronized with configured password
    await User.updateOne(
      { email: 'admin@erdosteine.com' },
      { $set: { password: hashedPassword } }
    );
  }

  // 2. Seed Default Brands
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

  // 3. Seed All Employees and Doctor Mappings from Book1.xlsx
  const activeMrCount = await User.countDocuments({ role: 'mr' });
  const doctorCount = await Doctor.countDocuments();

  if (activeMrCount < 50 || doctorCount < 100) {
    console.log('[ensureInitialSeed] Running Excel seed for employees and doctor mappings...');
    await seedFromExcel();
  }
}
