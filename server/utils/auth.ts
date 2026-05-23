import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

let runtimeFallbackSecret: string | null = null;

function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET;
  const isConfigured =
    configuredSecret &&
    configuredSecret.trim().length >= 32 &&
    !configuredSecret.includes('your-') &&
    !configuredSecret.includes('placeholder') &&
    !configuredSecret.includes('generate-a-safe');

  if (isConfigured) {
    return configuredSecret;
  }

  if (!runtimeFallbackSecret) {
    runtimeFallbackSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[AUTH] JWT_SECRET missing or weak. Using runtime-only fallback; sessions reset on restart.');
  }

  return runtimeFallbackSecret;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
  }

  static verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
      return decoded;
    } catch {
      return null;
    }
  }
}
