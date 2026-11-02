import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctorMapping extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: string;
  legacyCode: string;
  doctorName: string;
  specialty: string;
  location: string;
  region: string;
  pcode?: string;
  createdAt: Date;
}

const DoctorMappingSchema = new Schema<IDoctorMapping>({
  employeeId: { type: String, required: true, trim: true, index: true },
  legacyCode: { type: String, required: true, trim: true, index: true },
  doctorName: { type: String, required: true, trim: true },
  specialty: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  region: { type: String, trim: true, default: '' },
  pcode: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

DoctorMappingSchema.index({ employeeId: 1, legacyCode: 1 });

export const DoctorMapping: Model<IDoctorMapping> =
  mongoose.models.DoctorMapping || mongoose.model<IDoctorMapping>('DoctorMapping', DoctorMappingSchema);
export default DoctorMapping;
