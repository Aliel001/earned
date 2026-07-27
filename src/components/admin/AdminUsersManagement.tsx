import React, { useState } from 'react';
import { User, UserStatus } from '../../types';
import { adminApi } from '../../services/api';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Edit2,
  Trash2,
  Wallet as WalletIcon,
  Phone,
  Clock,
  X,
  Plus,
  Minus,
  Save,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';

interface AdminUsersManagementProps {
  users: User[];
  onRefresh: () => void;
}

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({ users, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected User Detail Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('Burundi');
  const [editStatus, setEditStatus] = useState<UserStatus>('approved');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Balance Control Modal
  const [balanceUser, setBalanceUser] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'reduce' | 'set'>('add');
  const [balanceAmount, setBalanceAmount] = useState<number>(1000);
  const [balanceNote, setBalanceNote] = useState<string>('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.phone_number.includes(search) ||
      (u.country && u.country.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, status: UserStatus) => {
    try {
      await adminApi.updateUserStatus(id, status);
      onRefresh();
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      onRefresh();
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditLoading(true);

    try {
      await adminApi.updateUser(editingUser.id, {
        username: editUsername.trim(),
        phone_number: editPhone.trim(),
        status: editStatus,
      });
      onRefresh();
      setEditingUser(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user information');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceUser) return;
    setBalanceLoading(true);

    try {
      await adminApi.updateUserBalance(balanceUser.id, balanceAction, balanceAmount, balanceNote);
      onRefresh();
      setBalanceUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user wallet balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Users Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Control user accounts, statuses, and wallet balance adjustments.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, phone..."
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase transition ${
                statusFilter === st
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/40'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-bold">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                      {u.profile_picture ? (
                        <img
                          src={u.profile_picture}
                          alt={u.username}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">@{u.username}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.country || 'Burundi'}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {u.phone_country_code} {u.phone_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          u.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                            : u.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40'
                            : u.status === 'suspended'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40'
                            : 'bg-slate-200 dark:bg-slate-700/20 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-600/40'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {(u.wallet?.balance || 0).toLocaleString()} BIF
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open Detail */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                          title="View Profile Details"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Balance Edit */}
                        <button
                          onClick={() => setBalanceUser(u)}
                          className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition"
                          title="Adjust Balance"
                        >
                          <WalletIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Info */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditUsername(u.username);
                            setEditPhone(u.phone_number);
                            setEditCountry(u.country || 'Burundi');
                            setEditStatus(u.status);
                          }}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl transition"
                          title="Edit User Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Approve */}
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'approved')}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition"
                            title="Approve User"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Suspend */}
                        {u.status !== 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'suspended')}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl transition"
                            title="Suspend User"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-4">
              {selectedUser.profile_picture ? (
                <img
                  src={selectedUser.profile_picture}
                  alt={selectedUser.username}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-2xl">
                  {selectedUser.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-black text-white">@{selectedUser.username}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedUser.phone_country_code} {selectedUser.phone_number}
                </p>
                <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-200">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet Balance:</span>
                <span className="font-extrabold text-emerald-400">
                  {(selectedUser.wallet?.balance || 0).toLocaleString()} BIF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created At:</span>
                <span className="text-slate-200">
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setBalanceUser(selectedUser);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <WalletIcon className="w-4 h-4" />
                <span>Adjust Balance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              <span>Edit User Information</span>
            </h3>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black py-2.5 rounded-xl text-xs"
                >
                  {editLoading ? 'Saving...' : 'Save User Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Balance Adjustment Modal */}
      {balanceUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setBalanceUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
              <WalletIcon className="w-4 h-4 text-emerald-400" />
              <span>Wallet Controls (@{balanceUser.username})</span>
            </h3>

            <p className="text-xs text-slate-400">
              Current Balance: <strong className="text-emerald-400">{(balanceUser.wallet?.balance || 0).toLocaleString()} BIF</strong>
            </p>

            <form onSubmit={handleSaveBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['add', 'reduce', 'set'] as const).map((act) => (
                    <button
                      type="button"
                      key={act}
                      onClick={() => setBalanceAction(act)}
                      className={`p-2 rounded-xl text-xs font-black uppercase border ${
                        balanceAction === act
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-white/5'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Amount (BIF)</label>
                <input
                  type="number"
                  min="1"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Note / Reason</label>
                <input
                  type="text"
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  placeholder="e.g. Admin reward bonus"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={balanceLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs"
              >
                {balanceLoading ? 'Updating Balance...' : 'Update Balance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
