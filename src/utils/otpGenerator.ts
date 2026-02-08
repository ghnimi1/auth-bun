const otpGenerator = require('otp-generator');
import { env } from '../config/env';

export class OTPGenerator {
  static generate(): string {
    return otpGenerator.generate(env.OTP_LENGTH, {
      digits: env.OTP_DIGITS_ONLY,
      lowerCaseAlphabets: !env.OTP_DIGITS_ONLY,
      upperCaseAlphabets: !env.OTP_DIGITS_ONLY,
      specialChars: false,
    });
  }

  static generateNumeric(): string {
    return otpGenerator.generate(env.OTP_LENGTH, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  }

  static generateAlphanumeric(): string {
    return otpGenerator.generate(env.OTP_LENGTH, {
      digits: true,
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: false,
    });
  }

  static getExpiryTime(): Date {
    const expiryMinutes = env.OTP_EXPIRY_MINUTES;
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    return expiryTime;
  }

  static isExpired(expiryTime: Date): boolean {
    return new Date() > expiryTime;
  }

  static validateOTP(inputOTP: string, storedOTP: string): boolean {
    return inputOTP === storedOTP;
  }

  static generateSecureOTP(): string {
    // Alternative method using crypto
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(3); // 3 bytes = 6 hex characters
    let otp = parseInt(buffer.toString('hex'), 16).toString();
    
    // Ensure it's exactly OTP_LENGTH digits
    while (otp.length < env.OTP_LENGTH) {
      otp = '0' + otp;
    }
    
    return otp.substring(0, env.OTP_LENGTH);
  }
}