import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { deleteCache } from '../lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign({ id: userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, fullName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, phone },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Store refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, accessToken, refreshToken },
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: { user: userWithoutPassword, accessToken, refreshToken },
  });
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ success: true, message: 'Logged out successfully' });
}

// POST /api/auth/refresh-token
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError(401, 'Refresh token required');

  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };

  const storedToken = await prisma.refreshToken.findFirst({
    where: { token, userId: decoded.id, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!storedToken) throw new AppError(401, 'Invalid or expired refresh token');

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role
  );

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId: storedToken.user.id, token: newRefreshToken, expiresAt },
  });

  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, fullName: true, phone: true,
      avatarUrl: true, role: true, isActive: true,
      emailVerified: true, createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  res.json({ success: true, data: user });
}

// PUT /api/auth/me
export async function updateMe(req: Request, res: Response): Promise<void> {
  const { fullName, phone, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { fullName, phone, avatarUrl },
    select: {
      id: true, email: true, fullName: true, phone: true,
      avatarUrl: true, role: true, updatedAt: true,
    },
  });
  await deleteCache(`user:${req.user!.id}`);
  res.json({ success: true, data: user });
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) {
    res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
    return;
  }
  // TODO: Send email with reset token
  res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
}
