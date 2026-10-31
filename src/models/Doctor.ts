import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  specialty: string;
  clinicHospital: string;
  cityLocation: string;
  phone?: string;
  createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true, trim: true, index: true },
  specialty: { type: String, required: true, trim: true, index: true },
  clinicHospital: { type: String, required: true, trim: true, index: true },
  cityLocation: { type: String, required: true, trim: true, index: true },
  phone: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

DoctorSchema.index({ name: 'text', clinicHospital: 'text', specialty: 'text', cityLocation: 'text' });

export const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;
