import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';
import { IDoctor } from './Doctor';

export interface IBrandItem {
  brandName: string;
  units: number;
}

export interface IVisit extends Document {
  _id: mongoose.Types.ObjectId;
  mr: mongoose.Types.ObjectId | IUser;
  doctor: mongoose.Types.ObjectId | IDoctor;
  visitDate: Date;
  brands: IBrandItem[];
  remarks?: string;
  createdAt: Date;
}

const BrandItemSchema = new Schema<IBrandItem>({
  brandName: { type: String, required: true, trim: true },
  units: { type: Number, required: true, min: 1 },
}, { _id: false });

const VisitSchema = new Schema<IVisit>({
  mr: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  visitDate: { type: Date, default: Date.now, index: true },
  brands: {
    type: [BrandItemSchema],
    required: true,
    validate: [
      (val: IBrandItem[]) => Array.isArray(val) && val.length >= 1 && val.length <= 5,
      'A visit must contain between 1 and 5 brand/unit entries',
    ],
  },
  remarks: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

VisitSchema.index({ mr: 1, visitDate: -1 });
VisitSchema.index({ doctor: 1, visitDate: -1 });

export const Visit: Model<IVisit> = mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
export default Visit;
