import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.js';
import { t } from '../locales/translations.js';
import { ImageItem } from '../types.js';
import { Heart, Image as ImageIcon, Search, Sparkles, CheckCircle2, Car, Shirt, Footprints, Smartphone, Package, Layers } from 'lucide-react';

interface ImagesGalleryProps {
  images: ImageItem[];
  onLikeImage: (imageId: string) => Promise<void>;
}

type CategoryType = 'All' | 'Cars' | 'Fashion' | 'Shoes' | 'Electronics' | 'Other';

const CATEGORIES: { id: CategoryType; label: string; icon: React.ElementType }[] = [
  { id: 'All', label: 'All Products', icon: Layers },
  { id: 'Cars', label: 'Cars (25)', icon: Car },
  { id: 'Fashion', label: 'Fashion (25)', icon: Shirt },
  { id: 'Shoes', label: 'Shoes (20)', icon: Footprints },
  { id: 'Electronics', label: 'Electronics (15)', icon: Smartphone },
  { id: 'Other', label: 'Other Products (15)', icon: Package },
];

export const ImagesGallery: React.FC<ImagesGalleryProps> = ({ images, onLikeImage }) => {
  const { language } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [likingId, setLikingId] = useState<string | null>(null);

  const safeImages = Array.isArray(images) ? images : [];
  const activeImages = safeImages.filter((img) => img && img.active);
  const filteredImages = activeImages.filter((img) => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      img.category === selectedCategory ||
      (selectedCategory === 'Cars' && (img.title.toLowerCase().includes('car') || img.title.toLowerCase().includes('sedan') || img.title.toLowerCase().includes('suv') || img.id.startsWith('img_car_'))) ||
      (selectedCategory === 'Fashion' && (img.title.toLowerCase().includes('dress') || img.title.toLowerCase().includes('shirt') || img.title.toLowerCase().includes('jacket') || img.id.startsWith('img_fsh_'))) ||
      (selectedCategory === 'Shoes' && (img.title.toLowerCase().includes('shoes') || img.title.toLowerCase().includes('sneakers') || img.title.toLowerCase().includes('pumps') || img.id.startsWith('img_sho_'))) ||
      (selectedCategory === 'Electronics' && (img.title.toLowerCase().includes('phone') || img.title.toLowerCase().includes('laptop') || img.title.toLowerCase().includes('headphones') || img.id.startsWith('img_ele_'))) ||
      (selectedCategory === 'Other' && img.id.startsWith('img_oth_'));

    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (cat: CategoryType) => {
    if (cat === 'All') return activeImages.length;
    return activeImages.filter(
      (img) =>
        img.category === cat ||
        (cat === 'Cars' && img.id.startsWith('img_car_')) ||
        (cat === 'Fashion' && img.id.startsWith('img_fsh_')) ||
        (cat === 'Shoes' && img.id.startsWith('img_sho_')) ||
        (cat === 'Electronics' && img.id.startsWith('img_ele_')) ||
        (cat === 'Other' && img.id.startsWith('img_oth_'))
    ).length;
  };

  const handleLike = async (imageId: string) => {
    setLikingId(imageId);
    try {
      await onLikeImage(imageId);

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Search Bar Container */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-md transition-all"
        />
      </div>

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center text-slate-400 space-y-2">
          <ImageIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">{t('no_images_available', language)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-md dark:shadow-xl flex flex-col justify-between hover:border-emerald-500/40 transition group"
            >
              {/* Image Thumbnail - Square Format Optimized for Mobile Marketplace Cards */}
              <div className="relative aspect-square bg-slate-900 overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Category & Reward Badges */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full shadow flex items-center space-x-1">
                  <span>{image.category || 'Product'}</span>
                </div>

                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-emerald-500/50 text-emerald-300 font-black text-xs px-2.5 py-1 rounded-full shadow-xl flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>+{image.reward.toLocaleString()} BIF</span>
                </div>

                {image.user_liked && (
                  <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur-md text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('liked', language)}</span>
                  </div>
                )}
              </div>

              {/* Footer Details */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1" title={image.title}>
                    {image.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-rose-500 dark:text-rose-400 fill-rose-500/30" />
                    <span>{image.likes_count || 0} {t('total_likes', language)}</span>
                  </p>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(image.id)}
                  disabled={image.user_liked || likingId === image.id}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shrink-0 ${
                    image.user_liked
                      ? 'bg-slate-800/80 text-slate-400 border border-white/10 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 active:scale-95'
                  }`}
                >
                  {likingId === image.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className={`w-3.5 h-3.5 ${image.user_liked ? 'fill-slate-400' : 'fill-white'}`} />
                  )}
                  <span className="hidden xs:inline">{image.user_liked ? t('liked', language) : t('like_btn', language)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
