export type TeamRole = 'Viewer' | 'Staff' | 'Admin' | 'Owner';

export interface PermissionCheck {
  canDeleteLeads: boolean;
  canManageTeam: boolean;
  canEditSettings: boolean;
  canTriggerAI: boolean;
  canExportReports: boolean;
}

export const ROLE_PERMISSIONS: Record<TeamRole, PermissionCheck> = {
  Viewer: {
    canDeleteLeads: false,
    canManageTeam: false,
    canEditSettings: false,
    canTriggerAI: false,
    canExportReports: true
  },
  Staff: {
    canDeleteLeads: false,
    canManageTeam: false,
    canEditSettings: false,
    canTriggerAI: true,
    canExportReports: true
  },
  Admin: {
    canDeleteLeads: true,
    canManageTeam: true,
    canEditSettings: true,
    canTriggerAI: true,
    canExportReports: true
  },
  Owner: {
    canDeleteLeads: true,
    canManageTeam: true,
    canEditSettings: true,
    canTriggerAI: true,
    canExportReports: true
  }
};

/**
 * Check if a role possesses the right to execute a feature action
 */
export function hasPermission(role: string | undefined, permission: keyof PermissionCheck): boolean {
  const normalized = (role || 'viewer').toLowerCase();
  const roleMap: Record<string, TeamRole> = {
    viewer: 'Viewer',
    staff: 'Staff',
    admin: 'Admin',
    owner: 'Owner'
  };
  const normRole = roleMap[normalized] || 'Viewer';
  const config = ROLE_PERMISSIONS[normRole] || ROLE_PERMISSIONS['Viewer'];
  return config[permission];
}
