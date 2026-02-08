import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  
  // OTP fields
  otp?: string;
  otpExpiry?: Date;
  otpAttempts: number;
  otpBlockedUntil?: Date;
  
  // Password reset
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
  isOTPBlocked(): boolean;
  incrementOTPAttempts(): Promise<void>;
  resetOTPAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    
    // OTP fields
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpBlockedUntil: {
      type: Date,
      select: false,
    },
    
    // Password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare passwords
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function (): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};


// Check if OTP attempts are blocked
userSchema.methods.isOTPBlocked = function (): boolean {
  if (this.otpBlockedUntil && new Date() < this.otpBlockedUntil) {
    return true;
  }
  
  // Reset block if time has passed
  if (this.otpBlockedUntil && new Date() >= this.otpBlockedUntil) {
    this.otpAttempts = 0;
    this.otpBlockedUntil = undefined;
    return false;
  }
  
  return false;
};

// Increment OTP attempts
userSchema.methods.incrementOTPAttempts = async function (): Promise<void> {
  this.otpAttempts += 1;
  
  // Block for 30 minutes after 5 failed attempts
  if (this.otpAttempts >= 5) {
    this.otpBlockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  await this.save();
};

// Reset OTP attempts
userSchema.methods.resetOTPAttempts = async function (): Promise<void> {
  this.otpAttempts = 0;
  this.otpBlockedUntil = undefined;
  await this.save();
};
/**
 * Export Model
 */
export const User =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
