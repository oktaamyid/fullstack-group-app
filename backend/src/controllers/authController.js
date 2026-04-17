const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function register(req, res) {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).find((errors) => Array.isArray(errors) && errors.length)?.[0];

    return sendError(res, 'Validation failed', 422, {
      errors: fieldErrors,
      detail: firstError || 'Invalid request payload',
    });
  }

  const { name, email, password } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    const token = signToken(createdUser);

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
        },
      },
      'Registration successful',
      201
    );
  } catch (error) {
    if (error?.code === 'P2002') {
      return sendError(res, 'Email already registered', 409);
    }

    return sendError(res, 'Failed to register user', 500, {
      error: error.message,
    });
  }
}

async function login(req, res) {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { email, password } = validation.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = signToken(user);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }, 'Login successful');
  } catch (error) {
    return sendError(res, 'Failed to login', 500, {
      error: error.message,
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }, 'Profile fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch profile', 500, {
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
