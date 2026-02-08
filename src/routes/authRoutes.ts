import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, validateRefreshToken } from '../middleware/auth';
import { validate, registerValidation, loginValidation, updateProfileValidation } from '../middleware/validate';

const router = Router();

// Public routes
router.post('/register', validate(registerValidation), AuthController.register);
router.post('/login', validate(loginValidation), AuthController.login);
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validate(updateProfileValidation), AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;