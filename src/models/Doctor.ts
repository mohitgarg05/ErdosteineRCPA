import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  specialty: string;
  clinicHospital?: string;
  cityLocation: string;
  phone?: string;
  legacyCode?: string;
  pcode?: string;
  region?: string;
  assignedEmployeeIds: string[];
  createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true, trim: true, index: true },
  specialty: { type: String, required: true, trim: true, index: true },
  clinicHospital: { type: String, trim: true, default: '' },
  cityLocation: { type: String, required: true, trim: true, index: true },
  phone: { type: String, trim: true },
  legacyCode: { type: String, trim: true, index: true },
  pcode: { type: String, trim: true },
  region: { type: String, trim: true, index: true },
  assignedEmployeeIds: { type: [String], index: true, default: [] },
  createdAt: { type: Date, default: Date.now },
});

DoctorSchema.index({ name: 'text', clinicHospital: 'text', specialty: 'text', cityLocation: 'text' });

export const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;
