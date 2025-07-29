import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: {
        values: ['email', 'google'],
        message: 'Invalid authentication provider',
      },
      default: 'email',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'deleted'],
        message: 'Invalid status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpires;
        delete ret.refreshToken;
        return ret;
      },
      versionKey: false,
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpires;
        delete ret.refreshToken;
        return ret;
      },
      versionKey: false,
    },
  }
);

// Create and export the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
