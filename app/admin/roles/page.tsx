'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldPlus,
  ShieldOff,
  Plus,
  Edit3,
  Trash2,
  Users,
  Search,
} from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Spinner } from '@/components/shared/Spinner';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/utils/format.utils';
import type { Role, Permission } from '@/types/role.types';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Roles the platform assigns automatically and must never be deleted.
 *
 * Kept in step with `RoleAssignmentPolicy::PROTECTED_ROLES` on the server. The
 * previous value here was `['admin']` alone, which disagreed with the backend's
 * old guard list of `['admin', 'super-admin']` — a name that does not exist in
 * this application. Both lists were therefore wrong in different ways, and
 * `user`, `customer` and `titan_member` were offered as deletable even though
 * RolePermissionSeeder grants them on every deploy.
 *
 * This is a display hint only. The server refuses regardless.
 */
const PROTECTED_ROLES = ['admin', 'user', 'customer', 'titan_member'];

const PERMISSION_LABELS: Record<string, string> = {
  manage_users: 'Manage Users',
  manage_roles: 'Manage Roles',
  manage_permissions: 'Manage Permissions',
  manage_customers: 'Manage Customers',
  manage_transactions: 'Manage Transactions',
  perform_transactions: 'Perform Transactions',
  navigate_application: 'Navigate Application',
  view_ledger: 'View Ledger',
  manage_ledger: 'Manage Ledger',
  approve_ledger: 'Approve Ledger',
  view_reports: 'View Reports',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleBadgeColor(roleName: string): string {
  const colorMap: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    user: 'bg-blue-100 text-blue-800 border-blue-200',
    customer: 'bg-green-100 text-green-800 border-green-200',
  };
  return colorMap[roleName.toLowerCase()] || 'bg-purple-100 text-purple-800 border-purple-200';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  // ── State - Data ──────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // ── State - Modals ────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // ── State - Form ──────────────────────────────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((r) => r === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions(),
      ]);

      // Parse roles
      if (rolesRes.success && rolesRes.data?.roles) {
        setRoles(rolesRes.data.roles);
      } else if (Array.isArray(rolesRes.data)) {
        setRoles(rolesRes.data as unknown as Role[]);
      } else {
        setRoles([]);
      }

      // Parse permissions
      if (permsRes.success && permsRes.data?.permissions) {
        setPermissions(permsRes.data.permissions);
      } else if (Array.isArray(permsRes.data)) {
        setPermissions(permsRes.data as unknown as Permission[]);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching roles/permissions:', error);
      showAlert('Failed to load roles and permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtered roles ────────────────────────────────────────────────────────
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.permissions.some((p) => p.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  // ── Handlers - Create ─────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormName('');
    setFormPermissions([]);
    setShowCreateModal(true);
  };

  const handleCreateRole = async () => {
    if (!formName.trim()) {
      showAlert('Role name is required', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await adminService.createRole({
        name: formName.trim().toLowerCase().replace(/\s+/g, '-'),
        guard_name: 'api',
        permissions: formPermissions,
      });

      if (res.success) {
        showAlert('Role created successfully', 'success');
        setShowCreateModal(false);
        fetchData();
      } else {
        showAlert(res.message || 'Failed to create role', 'error');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create role';
      showAlert(msg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Handlers - Edit ───────────────────────────────────────────────────────
  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormPermissions([...role.permissions]);
    setShowEditModal(true);
  };

  const handleEditRole = async () => {
    if (!selectedRole || !formName.trim()) {
      showAlert('Role name is required', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      const res = await adminService.updateRole(selectedRole.id, {
        name: formName.trim().toLowerCase().replace(/\s+/g, '-'),
        permissions: formPermissions,
      });

      if (res.success) {
        showAlert('Role updated successfully', 'success');
        setShowEditModal(false);
        setSelectedRole(null);
        fetchData();
      } else {
        showAlert(res.message || 'Failed to update role', 'error');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update role';
      showAlert(msg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Handlers - Delete ─────────────────────────────────────────────────────
  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      setLoadingAction(true);
      const res = await adminService.deleteRole(selectedRole.id);

      if (res.success) {
        showAlert('Role deleted successfully', 'success');
        setShowDeleteModal(false);
        setSelectedRole(null);
        fetchData();
      } else {
        showAlert(res.message || 'Failed to delete role', 'error');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete role';
      showAlert(msg, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Permission toggle ─────────────────────────────────────────────────────
  const togglePermission = (permName: string) => {
    setFormPermissions((prev) =>
      prev.includes(permName)
        ? prev.filter((p) => p !== permName)
        : [...prev, permName]
    );
  };

  const selectAllPermissions = () => {
    setFormPermissions(permissions.map((p) => p.name));
  };

  const deselectAllPermissions = () => {
    setFormPermissions([]);
  };

  // ── Guard render ──────────────────────────────────────────────────────────
  if (!isAdmin) return null;

  if (loading) {
    return <TableSkeleton rows={6} cols={4} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Roles Management
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Create, edit, and manage roles with their associated permissions
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-[#c9a84c] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#c9a84c]/20 transition hover:bg-[#b8962e]"
        >
          <Plus size={18} />
          Create Role
        </Button>
      </section>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
        />
        <input
          type="text"
          placeholder="Search roles by name or permission..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-[#d1d5db] bg-white py-3 pl-11 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10"
        />
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-purple-50 p-3">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Total Roles
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#111827]">
                {roles.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <ShieldPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Total Permissions
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#111827]">
                {permissions.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-50 p-3">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Protected Roles
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#111827]">
                {PROTECTED_ROLES.length}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Roles Table ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#f1f5f9] px-6 py-5">
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">
            All Roles
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredRoles.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef2ff]">
              <ShieldOff className="h-8 w-8 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#111827]">
              No roles found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6b7280]">
              {searchQuery
                ? 'No roles match your search criteria.'
                : 'Create your first role to get started.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    {['Role Name', 'Guard', 'Permissions', 'Created', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#6b7280] ${
                            h === 'Actions' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b border-[#f8fafc] transition-colors hover:bg-[#fafafa]"
                    >
                      {/* Role Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${getRoleBadgeColor(role.name)}`}
                          >
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </span>
                        </div>
                      </td>

                      {/* Guard */}
                      <td className="px-6 py-4">
                        <code className="rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-mono text-[#6b7280]">
                          {role.guard_name}
                        </code>
                      </td>

                      {/* Permissions */}
                      <td className="px-6 py-4">
                        <div className="flex max-w-[400px] flex-wrap gap-1.5">
                          {role.permissions.length > 0 ? (
                            role.permissions.map((perm) => (
                              <Badge key={perm} variant="info" size="sm">
                                {PERMISSION_LABELS[perm] || perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-[#9ca3af]">No permissions</span>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {formatDate(role.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(role)}
                            title="Edit Role"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(role)}
                            disabled={PROTECTED_ROLES.includes(role.name)}
                            title={
                              PROTECTED_ROLES.includes(role.name)
                                ? 'Protected role cannot be deleted'
                                : 'Delete Role'
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 p-4 xl:hidden">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-[22px] border border-[#edf2f7] bg-[#fcfcfd] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${getRoleBadgeColor(role.name)}`}
                      >
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </span>
                      <p className="mt-2 text-xs text-[#6b7280]">
                        Guard: <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 font-mono">{role.guard_name}</code>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className="rounded-lg p-2 text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(role)}
                        disabled={PROTECTED_ROLES.includes(role.name)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                      Permissions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.length > 0 ? (
                        role.permissions.map((perm) => (
                          <Badge key={perm} variant="info" size="sm">
                            {PERMISSION_LABELS[perm] || perm}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-[#9ca3af]">No permissions</span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-[#6b7280]">
                    Created {formatDate(role.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Create Role Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Role Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., manager, editor, support..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <p className="mt-1 text-xs text-[#6b7280]">
              Will be auto-formatted to lowercase with hyphens
            </p>
          </div>

          {/* Permissions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-[#111827]">
                Assign Permissions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPermissions}
                  className="text-xs font-semibold text-[#4a5ff7] hover:text-[#3a4fe7] transition"
                >
                  Select All
                </button>
                <span className="text-xs text-[#9ca3af]">|</span>
                <button
                  onClick={deselectAllPermissions}
                  className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e5e7eb] p-3 transition hover:bg-[#f8fafc]"
                >
                  <input
                    type="checkbox"
                    checked={formPermissions.includes(perm.name)}
                    onChange={() => togglePermission(perm.name)}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#c9a84c] focus:ring-[#c9a84c]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#111827]">
                      {PERMISSION_LABELS[perm.name] || perm.name}
                    </span>
                    <p className="text-xs text-[#6b7280] font-mono">{perm.name}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateRole}
              disabled={loadingAction || !formName.trim()}
              className="flex-1"
            >
              {loadingAction ? (
                <>
                  <Spinner />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Role Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Role${selectedRole ? `: ${selectedRole.name}` : ''}`}
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Role Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Role name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={selectedRole ? PROTECTED_ROLES.includes(selectedRole.name) : false}
            />
            {selectedRole && PROTECTED_ROLES.includes(selectedRole.name) && (
              <p className="mt-1 text-xs text-amber-600">
                The name of protected roles cannot be changed.
              </p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-[#111827]">
                Permissions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPermissions}
                  className="text-xs font-semibold text-[#4a5ff7] hover:text-[#3a4fe7] transition"
                >
                  Select All
                </button>
                <span className="text-xs text-[#9ca3af]">|</span>
                <button
                  onClick={deselectAllPermissions}
                  className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e5e7eb] p-3 transition hover:bg-[#f8fafc]"
                >
                  <input
                    type="checkbox"
                    checked={formPermissions.includes(perm.name)}
                    onChange={() => togglePermission(perm.name)}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#c9a84c] focus:ring-[#c9a84c]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#111827]">
                      {PERMISSION_LABELS[perm.name] || perm.name}
                    </span>
                    <p className="text-xs text-[#6b7280] font-mono">{perm.name}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
            <Button
              variant="primary"
              size="md"
              onClick={handleEditRole}
              disabled={loadingAction || !formName.trim()}
              className="flex-1"
            >
              {loadingAction ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-semibold text-red-800">
                  Are you sure you want to delete this role?
                </p>
                {selectedRole && (
                  <p className="mt-2 text-sm text-red-600">
                    Role: <strong>{selectedRole.name}</strong>
                    <br />
                    This action cannot be undone. Users with this role will lose
                    all associated permissions.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteRole}
              disabled={loadingAction}
              className="flex-1"
            >
              {loadingAction ? (
                <>
                  <Spinner />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
