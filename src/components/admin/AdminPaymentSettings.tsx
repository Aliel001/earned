import React, { useState, useEffect } from 'react';
import { PaymentSettings } from '../../types';
import { adminApi } from '../../services/api';
import { Settings, Save, CheckCircle2, AlertCircle, Phone, CreditCard, MessageSquare, Code } from 'lucide-react';

interface AdminPaymentSettingsProps {
  initialSettings: PaymentSettings | null;
  onRefresh: () => void;
}

export const AdminPaymentSettings: React.FC<AdminPaymentSettingsProps> = ({
  initialSettings,
  onRefresh,
}) => {
  const [accountNumber, setAccountNumber] = useState(initialSettings?.account_number || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsapp_number || '');
  const [ussdCode, setUssdCode] = useState(initialSettings?.ussd_code || '');
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialSettings?.payment_instructions || ''
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setAccountNumber(initialSettings.account_number || '');
      setWhatsappNumber(initialSettings.whatsapp_number || '');
      setUssdCode(initialSettings.ussd_code || '');
      setPaymentInstructions(initialSettings.payment_instructions || '');
    }
  }, [initialSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await adminApi.updatePaymentSettings({
        account_number: accountNumber.trim(),
        whatsapp_number: whatsappNumber.trim(),
        ussd_code: ussdCode.trim(),
        payment_instructions: paymentInstructions.trim(),
      });
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Payment Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Configure admin payment accounts, WhatsApp contact, USSD code, and payout instructions shown to users.
        </p>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-lg dark:shadow-2xl space-y-4 transition-colors duration-300">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Payment settings saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Admin Account Number (Lumicash / Ecocash)</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="+257 69 00 11 22"
              required
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Admin WhatsApp Contact Number</span>
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="+257 69 00 11 22"
              required
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>USSD Shortcode (Lumicash / Ecocash code)</span>
            </label>
            <input
              type="text"
              value={ussdCode}
              onChange={(e) => setUssdCode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="*163#"
              required
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Payment & Withdrawal Instructions (For Users)</span>
            </label>
            <textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl p-4 text-slate-900 dark:text-white font-medium focus:outline-none"
              placeholder="Write clear payout instructions for users..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Payment Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
