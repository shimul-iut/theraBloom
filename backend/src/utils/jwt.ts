import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
    userId: string;
    tenantId: string;
    role: UserRole;
    phoneNumber: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        throw error;
    }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch {
        return null;
    }
}
