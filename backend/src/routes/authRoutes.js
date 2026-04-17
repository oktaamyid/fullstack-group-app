const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const authController = require('../controllers/authController');
const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateRequest(updateProfileSchema), authController.updateProfile);
router.patch('/profile/password', authMiddleware, validateRequest(changePasswordSchema), authController.changePassword);

module.exports = router;
