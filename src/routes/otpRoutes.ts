import { Router } from 'express';
import { OTPController, otpValidation } from '../controllers/otpController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Public routes
router.post('/send-login-otp', 
  validate(otpValidation.sendOTP), 
  OTPController.sendLoginOTP
);

router.post('/verify-login-otp',
  validate(otpValidation.verifyOTP),
  OTPController.verifyLoginOTP
);

router.post('/resend-otp',
  validate(otpValidation.sendOTP),
  OTPController.resendOTP
);

router.post('/request-password-reset',
  validate(otpValidation.sendOTP),
  OTPController.requestPasswordReset
);

router.post('/validate-reset-token',
  OTPController.validateResetToken
);

router.post('/reset-password',
  validate(otpValidation.resetPassword),
  OTPController.resetPassword
);

router.post('/check-otp-status',
  validate(otpValidation.sendOTP),
  OTPController.checkOTPStatus
);

// Protected routes (require authentication)
router.post('/send-verification-otp',
  authenticate,
  OTPController.sendVerificationOTP
);

router.post('/verify-email-otp',
  authenticate,
  OTPController.verifyEmailOTP
);

router.post('/send-2fa-otp',
  authenticate,
  OTPController.send2FAOTP
);

router.post('/verify-2fa-otp',
  authenticate,
  OTPController.verify2FAOTP
);

export default router;