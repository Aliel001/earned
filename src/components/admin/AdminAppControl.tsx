import React, { useState, useEffect } from 'react';
import { GeneralSettings, ImageItem } from '../../types';
import { adminApi } from '../../services/api';
import {
  Sliders,
  Image as ImageIcon,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Save,
  AlertCircle,
  Power,
  Gift,
  Heart,
  Wallet,
  Globe,
  Upload,
} from 'lucide-react';

interface AdminAppControlProps {
  images: ImageItem[];
  onRefresh: () => void;
}

export const AdminAppControl: React.FC<AdminAppControlProps> = ({ images, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'settings'>('images');

  // --- SECTION A: IMAGE MANAGEMENT STATES ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageReward, setImageReward] = useState<number>(1000);
  const [imageActive, setImageActive] = useState(true);
  const [imageCategory, setImageCategory] = useState<'Cars' | 'Fashion' | 'Shoes' | 'Electronics' | 'Other'>('Cars');
  const [imageLoading, setImageLoading] = useState(false);

  // --- SECTION B: GENERAL SETTINGS STATES ---
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [regBonus, setRegBonus] = useState(15000);
  const [likeReward, setLikeReward] = useState(1000);
  const [minWithdraw, setMinWithdraw] = useState(5000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    loadGeneralSettings();
  }, []);

  const loadGeneralSettings = async () => {
    try {
      const res = await adminApi.getGeneralSettings();
      setGeneralSettings(res);
      setRegBonus(res.registration_bonus || 15000);
      setLikeReward(res.like_reward || 1000);
      setMinWithdraw(res.min_withdraw_amount || 5000);
      setMaintenanceMode(res.maintenance_mode || false);
    } catch {
      // default fallbacks if endpoint fails
    }
  };

  // Image CRUD Handlers
  const handleOpenAddImage = () => {
    setEditingImage(null);
    setImageTitle('');
    setImageUrl('');
    setImageReward(1000);
    setImageActive(true);
    setImageCategory('Cars');
    setShowImageModal(true);
  };

  const handleOpenEditImage = (img: ImageItem) => {
    setEditingImage(img);
    setImageTitle(img.title);
    setImageUrl(img.image_url);
    setImageReward(img.reward || 1000);
    setImageActive(img.active !== undefined ? img.active : true);
    setImageCategory(img.category || 'Other');
    setShowImageModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size too large (Max 8MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageLoading(true);

    try {
      if (editingImage) {
        await adminApi.updateImage(editingImage.id, {
          title: imageTitle.trim(),
          image_url: imageUrl.trim(),
          reward: imageReward,
          active: imageActive,
          category: imageCategory,
        });
      } else {
        await adminApi.createImage({
          title: imageTitle.trim(),
          image_url: imageUrl.trim(),
          reward: imageReward,
          active: imageActive,
        });
      }
      onRefresh();
      setShowImageModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await adminApi.deleteImage(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);

    try {
      const updated = await adminApi.updateGeneralSettings({
        registration_bonus: regBonus,
        like_reward: likeReward,
        min_withdraw_amount: minWithdraw,
        maintenance_mode: maintenanceMode,
      });
      setGeneralSettings(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update general app settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>App Control Center</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Control application image library and general business parameters.
        </p>
      </div>

      {/* Control Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 gap-4">
        <button
          onClick={() => setActiveTab('images')}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'images'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image Management ({images.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'settings'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General Settings</span>
        </button>
      </div>

      {/* SECTION A: IMAGE MANAGEMENT */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Images managed here appear strictly on the User Images page.
            </p>
            <button
              onClick={handleOpenAddImage}
              className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Image</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg dark:shadow-2xl flex flex-col justify-between transition-colors duration-300"
              >
                <div className="relative aspect-video">
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-md ${
                      img.active ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {img.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    +{img.reward || 1000} BIF
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2">{img.title}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Category: {img.category || 'Other'}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => handleOpenEditImage(img)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20 transition"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION B: GENERAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-lg dark:shadow-2xl max-w-2xl space-y-5 transition-colors duration-300">
          {settingsSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>General settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Registration Welcome Bonus (BIF)</span>
              </label>
              <input
                type="number"
                value={regBonus}
                onChange={(e) => setRegBonus(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Like Reward per Image (BIF)</span>
              </label>
              <input
                type="number"
                value={likeReward}
                onChange={(e) => setLikeReward(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Minimum Withdrawal Amount (BIF)</span>
              </label>
              <input
                type="number"
                value={minWithdraw}
                onChange={(e) => setMinWithdraw(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div className="pt-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-1.5">
                <Power className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Application Maintenance Mode</span>
              </label>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-full p-4 rounded-2xl border font-bold flex items-center justify-between transition ${
                  maintenanceMode
                    ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{maintenanceMode ? 'Maintenance Mode ACTIVE (Access Blocked)' : 'System Normal (Online)'}</span>
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                  {maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{settingsLoading ? 'Saving Settings...' : 'Save General Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{editingImage ? 'Edit Image' : 'Upload / Add Image'}</span>
            </h3>

            <form onSubmit={handleSaveImage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title / Caption</label>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  placeholder="e.g. Beautiful Tanganyika Beach"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Image URL or File Upload</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
                    placeholder="https://..."
                    required
                  />
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold p-2.5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center space-x-1 shrink-0">
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px]">Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-white/10" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reward (BIF)</label>
                  <input
                    type="number"
                    value={imageReward}
                    onChange={(e) => setImageReward(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={imageCategory}
                    onChange={(e) => setImageCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Cars">Cars</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="imageActive"
                  checked={imageActive}
                  onChange={(e) => setImageActive(e.target.checked)}
                  className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10"
                />
                <label htmlFor="imageActive" className="font-bold text-slate-700 dark:text-slate-300">
                  Active (Visible to users)
                </label>
              </div>

              <button
                type="submit"
                disabled={imageLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white dark:text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition"
              >
                {imageLoading ? 'Saving...' : 'Save Image'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
