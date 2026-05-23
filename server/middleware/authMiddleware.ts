import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { BusinessMemberRepository } from '../repositories/businessMemberRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
  businessId?: string;
  membershipRole?: 'owner' | 'admin' | 'staff' | 'viewer';
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'] as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Sesi tidak sah. Silakan login kembali.' });
    }

    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' });
    }

    const user = await UserProfileRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan.' });
    }

    // Attach user payload
    (req as any).user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name
    };

    // Inject active tenant business context
    const headerBusinessId = req.headers['x-business-id'];
    const activeBusinessId = (headerBusinessId as string) || user.default_business_id;

    if (activeBusinessId) {
      (req as any).businessId = activeBusinessId;
      // Hard-isolate all requests to the matching tenant's business ID
      req.query.business_id = activeBusinessId;
      if (req.body && typeof req.body === 'object') {
        req.body.business_id = activeBusinessId;
      }

      // Check role/membership
      const membership = await BusinessMemberRepository.getMembership(activeBusinessId, user.id);
      if (membership) {
        (req as any).membershipRole = membership.role;
      } else {
        // Enforce boundary check: if the user tries to load a workspace where they aren't enrolled
        return res.status(403).json({ success: false, error: 'Akses ditolak. Anda bukan anggota dari workspace bisnis ini.' });
      }
    } else {
      // If there is no business created yet (onboarding state), we let them go simpleAuthMiddleware
    }

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(500).json({ success: false, error: 'Kesalahan otentikasi internal server.' });
  }
}

// Bypasses active tenant requirement (e.g., during onboarding/getting workspaces list)
export async function simpleAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'] as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Sesi tidak sah. Silakan login kembali.' });
    }

    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' });
    }

    const user = await UserProfileRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User tidak ditemukan.' });
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name
    };

    next();
  } catch (error) {
    console.error('Error in simpleAuthMiddleware:', error);
    return res.status(500).json({ success: false, error: 'Kesalahan otentikasi internal.' });
  }
}
