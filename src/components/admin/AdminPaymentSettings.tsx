import React, { useState, useEffect } from 'react';
import { PaymentSettings } from '../../types';
import { adminApi } from '../../services/api';
import { Settings, Save, CheckCircle2, AlertCircle, Phone, CreditCard, MessageSquare, Code, Trash2, RefreshCw, Eye } from 'lucide-react';

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

  const handleClearDefaults = () => {
    setAccountNumber('');
    setWhatsappNumber('');
    setUssdCode('');
    setPaymentInstructions('');
    setError(null);
    setSuccess(false);
  };

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
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Admin Payment Settings (Ihitamo Ry'Ubwishyu)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Siba amakuru ya kera (records z'i kera) hanyuma ushyiremo numero zawe z'ubwishyu, WhatsApp, USSD code, n'amabwiriza y'abakoresha.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearDefaults}
          className="inline-flex items-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>Siba Records z'Ibya Kera (Clear Defaults)</span>
        </button>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-lg dark:shadow-2xl space-y-5 transition-colors duration-300">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Amakuru mashya y'ubwishyu yabitswe neza! (Payment settings updated successfully)</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Numero za Admin z'Ubwishyu (Lumicash / Ecocash / Mobile Money)</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="Shyiramo numero ya Lumicash/Ecocash (e.g. +257 69 12 34 56)"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Iyi numero ni yo abakoresha babona mu kwasaba ubwishyu.</p>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Numero ya WhatsApp ya Admin (WhatsApp Contact)</span>
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="Shyiramo numero ya WhatsApp (e.g. +257 69 12 34 56)"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Iyi numero ni yo abakoresha bakoresha mu kuvugana na Admin kuri WhatsApp.</p>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>USSD Shortcode (Ikode ya USSD y'Ubwishyu)</span>
            </label>
            <input
              type="text"
              value={ussdCode}
              onChange={(e) => setUssdCode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
              placeholder="e.g. *163# cyangwa *182#"
              required
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Amabwiriza y'Ubwishyu (Payment & Payout Instructions)</span>
            </label>
            <textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-2xl p-4 text-slate-900 dark:text-white font-medium focus:outline-none"
              placeholder="Andika amabwiriza asobanuye neza uko abakoresha bishyura cyangwa babikuza..."
              required
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Iri kubika...' : 'Bika Payment Settings (Save Admin Payment)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="bg-slate-900/90 border border-teal-500/20 rounded-3xl p-5 text-white space-y-3">
        <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs uppercase tracking-wider">
          <Eye className="w-4 h-4 text-teal-400" />
          <span>Ikanisa: Uko Abakoresha Babibona (Live User Preview)</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold">Numero za Admin:</span>
            <span className="font-mono text-emerald-400 font-black">{accountNumber || '(Nta numero yashyizweho)'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold">WhatsApp Contact:</span>
            <span className="font-mono text-teal-400 font-black">{whatsappNumber || '(Nta WhatsApp)'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold">USSD Dial Code:</span>
            <span className="font-mono text-amber-400 font-black">{ussdCode || '(Nta code)'}</span>
          </div>
          <div className="pt-2 border-t border-white/10 text-slate-300 text-[11px]">
            <p className="font-bold text-slate-400 mb-1">Amabwiriza y'abakoresha:</p>
            <p className="italic bg-slate-900 p-2.5 rounded-xl border border-white/5">{paymentInstructions || '(Nta mabwiriza yashyizweho)'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

