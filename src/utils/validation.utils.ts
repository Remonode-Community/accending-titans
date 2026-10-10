import { z } from 'zod';
import { E164_PHONE_REGEX } from './constants';

// Authentication Schemas
export const registerSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters').max(255),
    last_name: z.string().min(2, 'Last name must be at least 2 characters').max(255),
    email: z.string().email('Invalid email address'),
    phone_number: z
      .string()
      .transform(val => val.replace(/\s+/g, '')) // Remove all spaces
      .refine(val => E164_PHONE_REGEX.test(val), {
        message: 'Phone number must be in E.164 format (e.g., +234XXXXXXXXXX) or local format (e.g., 08XXXXXXXXXX)',
      }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    password_confirmation: z.string(),
    referral_code: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Passwords do not match',
    path: ['new_password_confirmation'],
  });

// Profile Schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  phone: z
    .string()
    .transform(val => val.replace(/\s+/g, '')) // Remove all spaces
    .refine(val => E164_PHONE_REGEX.test(val), {
      message: 'Phone number must be in E.164 format or local format (e.g., 08XXXXXXXXXX)',
    })
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
});

// Transaction Schemas
//
// `purchaseAirtimeSchema` and `purchaseDataSchema` were removed with the VTU
// feature. They validated airtime top-ups and data bundle purchases, and had no
// callers once the purchase service methods went.

export const payBillsSchema = z.object({
  bill_type: z.enum(['electricity', 'water', 'internet', 'insurance']),
  provider: z.string().min(1, 'Provider is required'),
  account_number: z.string().min(1, 'Account number is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['wallet', 'card', 'mobile_money']),
  is_estimate: z.boolean().optional(),
});

// Types
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
export type ResendOTPSchema = z.infer<typeof resendOTPSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type PayBillsSchema = z.infer<typeof payBillsSchema>;
