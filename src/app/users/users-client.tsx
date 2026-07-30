'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, UserCog, Power, PowerOff, Mail, Calendar, Shield, MoreHorizontal } from 'lucide-react';
import { createUser, updateUser, toggleUserStatus } from '../actions/users';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      name: formData.name,
      email: formData.email,
      role: formData.role as 'ADMIN' | 'EMPLOYEE',
      ...(formData.password && { password: formData.password }),
    };

    let res;
    if (formData.id) {
      res = await updateUser(formData.id, dataToSubmit);
    } else {
      res = await createUser(dataToSubmit);
    }

    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success(`User ${formData.id ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      // Wait for revalidation or update local state manually for fast UI
      // A full page reload or a router.refresh() might be needed for the new list,
      // but let's assume we want a simple refresh:
      window.location.reload(); 
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleUserStatus(id, !currentStatus);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success(`User ${!currentStatus ? 'activated' : 'disabled'}!`);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">
                      <Shield className="w-3 h-3 text-blue-500" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100/50 text-red-700 border border-red-200/50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive 
                            ? "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                            : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        }`}
                        title={user.isActive ? "Disable User" : "Enable User"}
                      >
                        {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">
              {formData.id ? 'Edit Staff' : 'Add New Staff'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password {formData.id && <span className="text-xs text-muted-foreground font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!formData.id}
                  minLength={6}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
