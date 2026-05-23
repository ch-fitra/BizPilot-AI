import { Request, Response, NextFunction } from 'express';

export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer';

export class RolePermissions {
  static canView(role: UserRole): boolean {
    return ['owner', 'admin', 'staff', 'viewer'].includes(role);
  }

  static canEdit(role: UserRole): boolean {
    return ['owner', 'admin', 'staff'].includes(role);
  }

  static canDelete(role: UserRole): boolean {
    return ['owner', 'admin'].includes(role);
  }

  static canManageUsers(role: UserRole): boolean {
    return ['owner', 'admin'].includes(role);
  }
}

export function enforceRole(requiredPermissions: 'view' | 'edit' | 'delete' | 'manageUsers') {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).membershipRole as UserRole | undefined;
    const businessId = (req as any).businessId;

    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Konteks bisnis/workspace tidak terdeteksi.' });
    }

    if (!role) {
      return res.status(403).json({ success: false, error: 'Akses ditolak. Anda bukan anggota dari workspace ini.' });
    }

    let isAuthorized = false;
    switch (requiredPermissions) {
      case 'view':
        isAuthorized = RolePermissions.canView(role);
        break;
      case 'edit':
        isAuthorized = RolePermissions.canEdit(role);
        break;
      case 'delete':
        isAuthorized = RolePermissions.canDelete(role);
        break;
      case 'manageUsers':
        isAuthorized = RolePermissions.canManageUsers(role);
        break;
      default:
        isAuthorized = false;
    }

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        error: `Akses ditolak. Peran "${role}" Anda tidak memiliki izin untuk tindakan ini.` 
      });
    }

    next();
  };
}
