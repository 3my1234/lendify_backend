import mongoose, { Schema, Document, Types } from 'mongoose';

interface IInvestmentPool extends Document {
  totalAmount: number;
  activeInvestors: number;
  loanCompanies: Array<{
    name: string;
    allocatedAmount: number;
    returnRate: number;
    duration: number;
  }>;
  status: 'active' | 'closed';
}

const InvestmentPoolSchema = new Schema({
  totalAmount: { type: Number, required: true, default: 0 },
  activeInvestors: { type: Number, default: 0 },
  loanCompanies: [{
    name: String,
    allocatedAmount: Number,
    returnRate: Number,
    duration: Number
  }],
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model<IInvestmentPool>('InvestmentPool', InvestmentPoolSchema);
