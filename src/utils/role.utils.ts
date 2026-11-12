/**
 * Role-selection rules shared by the RoleSwitcher and every guard that
 * routes on `activeRole`.
 *
 * The switcher lets a lone admin pick a "user" view even though `user`
 * is not a real role on their account — it is a synthetic override so an
 * admin can see the member experience. Any check that treats `activeRole`
 * as valid only when it appears in `user.roles` silently rejects that
 * override and bounces the admin back to /admin (the primary role), which
 * is exactly the "switching admin → user does nothing" bug.
 */

/**
 * Whether `role` may be used as the active role given the user's real roles.
 *
 * Valid when:
 * - `role` is one of the user's actual roles, OR
 * - `role` is the synthetic 'user' view and the user is an admin.
 */
export const canUseRole = (roles: string[] | undefined | null, role: string): boolean => {
  if (!roles || roles.length === 0) return false;
  if (roles.includes(role)) return true;
  return roles.includes('admin') && role === 'user';
};

/**
 * The fallback role when no (valid) role is manually selected.
 * Order of priority: admin > agent > customer/user > first role.
 */
export const getPrimaryRole = (roles: string[] | undefined | null): string | null => {
  if (!roles || roles.length === 0) return null;
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('agent')) return 'agent';
  return roles.find((r) => r === 'customer' || r === 'user') || roles[0];
};
