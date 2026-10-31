import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  isOwnProduct: boolean;
  isActive: boolean;
  createdAt: Date;
}

const BrandSchema = new Schema<IBrand>({
  name: { type: String, required: true, unique: true, trim: true },
  isOwnProduct: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
export default Brand;
