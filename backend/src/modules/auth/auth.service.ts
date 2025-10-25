import prisma from '../../config/database';
import redis from '../../config/redis';
import { comparePassword } from '../../utils/password';
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '../../utils/jwt';
import { LoginInput } from './auth.schema';

export class AuthService {
  /**
   * Login user
   */
  async login(input: LoginInput) {
    const { phoneNumber, password } = input;

    // Find user by phone number
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber,
        active: true,
      },
      include: {
        Tenant: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if tenant is active
    if (!user.Tenant.active) {
      throw new Error('Your organization account is inactive');
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      phoneNumber: user.phoneNumber!,
    };

    const tokens = generateTokenPair(payload);

    // Store refresh token in Redis (7 days TTL)
    const refreshTokenKey = `refresh_token:${user.id}`;
    await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.Tenant.name,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const refreshTokenKey = `refresh_token:${payload.userId}`;
    const storedToken = await redis.get(refreshTokenKey);

    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user to ensure they're still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { Tenant: true },
    });

    if (!user || !user.active || !user.Tenant.active) {
      throw new Error('User or tenant is inactive');
    }

    // Generate new tokens
    const newPayload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      phoneNumber: user.phoneNumber!,
    };

    const tokens = generateTokenPair(newPayload);

    // Update refresh token in Redis
    await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.Tenant.name,
      },
      tokens,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    // Remove refresh token from Redis
    const refreshTokenKey = `refresh_token:${userId}`;
    await redis.del(refreshTokenKey);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        active: true,
        createdAt: true,
        Tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
