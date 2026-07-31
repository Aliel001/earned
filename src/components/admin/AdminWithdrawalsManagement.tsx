import React, { useState } from 'react';
import { WithdrawRequest, WithdrawStatus } from '../../types.js';
import { adminApi } from '../../services/api.js';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MessageSquare,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface AdminWithdrawalsManagementProps {
  withdraws: WithdrawRequest[];
  onRefresh: () => void;
}

export const AdminWithdrawalsManagement: React.FC<AdminWithdrawalsManagementProps> = ({
  withdraws,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Withdraw for Processing Modal
  const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawRequest | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  // Delete Confirm Modal
  const [deletingWithdraw, setDeletingWithdraw] = useState<WithdrawRequest | null>(null);
  const [deleteWithdrawLoading, setDeleteWithdrawLoading] = useState(false);

  const filteredWithdraws = withdraws.filter((w) => {
    const matchesSearch =
      (w.username && w.username.toLowerCase().includes(search.toLowerCase())) ||
      (w.payment_account && w.payment_account.includes(search)) ||
      w.amount.toString().includes(search);
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessWithdraw = async (status: WithdrawStatus) => {
    if (!selectedWithdraw) return;
    setProcessing(true);

    try {
      await adminApi.processWithdraw(selectedWithdraw.id, status, adminMessage);
      onRefresh();
      setSelectedWithdraw(null);
      setAdminMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to process withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const confirmDeleteWithdraw = async () => {
    if (!deletingWithdraw) return;
    setDeleteWithdrawLoading(true);
    try {
      await adminApi.deleteWithdraw(deletingWithdraw.id);
      onRefresh();
      setDeletingWithdraw(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete withdrawal record');
    } finally {
      setDeleteWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <span>Withdrawals Management</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Review, approve, or reject user payout requests and attach admin messages.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, account number..."
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 focus:border-rose-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase transition ${
                statusFilter === st
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals List Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Account</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWithdraws.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                    No withdrawal requests found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredWithdraws.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      @{w.username || w.user_id}
                    </td>

                    <td className="py-3.5 px-4 font-black text-rose-400">
                      {w.amount.toLocaleString()} BIF
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {w.payment_account}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : w.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedWithdraw(w);
                            setAdminMessage(w.admin_message || '');
                          }}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold transition"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => setDeletingWithdraw(w)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition"
                          title="Delete Record"
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

      {/* Process Modal */}
      {selectedWithdraw && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedWithdraw(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Process Withdrawal Request</span>
            </h3>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-bold text-white">@{selectedWithdraw.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-black text-rose-400">{selectedWithdraw.amount.toLocaleString()} BIF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Account:</span>
                <span className="font-mono text-emerald-400">{selectedWithdraw.payment_account}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="block font-bold text-slate-300">
                Admin Message / Note for User
              </label>
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="e.g. Transaction completed via Lumicash TXN #88291"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs h-20 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleProcessWithdraw('approved')}
                disabled={processing}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Payout</span>
              </button>
              <button
                onClick={() => handleProcessWithdraw('rejected')}
                disabled={processing}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject & Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Withdraw Confirmation Modal */}
      {deletingWithdraw && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setDeletingWithdraw(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Siba Ubusabe (Delete Withdrawal Record)?</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Siba ubusabe bwa {deletingWithdraw.amount.toLocaleString()} BIF bw'umukoresha @{deletingWithdraw.username || 'user'}?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWithdraw(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
              >
                Hagarika (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteWithdraw}
                disabled={deleteWithdrawLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {deleteWithdrawLoading ? 'Gusiba...' : 'Emeza Gusiba'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
