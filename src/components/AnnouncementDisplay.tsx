import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Megaphone, 
  Tag, 
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';

interface Announcement {
  id: string;
  type: 'admission' | 'discount' | 'generic';
  title: string;
  content: any;
  image_url: string | null;
}

export default function AnnouncementDisplay() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showMobileContent, setShowMobileContent] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, type, title, content, image_url')
        .gt('expires_at', new Date().toISOString())
        .limit(7);
      
      if (data) setAnnouncements(data);
    };

    fetchAnnouncements();
  }, []);

  // Auto-rotation logic for desktop
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  // Handle mobile scroll syncing
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };

  const nextAnn = () => setCurrentIndex((prev) => (prev + 1) % announcements.length);

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div 
      className="fixed bottom-0 left-0 w-full md:bottom-12 md:left-8 md:w-[21.6rem] z-[60] pointer-events-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pointer-events-auto relative px-4 pb-4 md:px-0 md:pb-0">
        {/* Desktop Container */}
        <div className="hidden md:block overflow-hidden shadow-2xl transition-all duration-500 animate-in slide-in-from-left-8 scale-90 origin-bottom-left">
           <div className="relative">
              {/* Desktop Close Button */}
              <button 
                onClick={() => setIsVisible(false)}
                className={`absolute top-4 right-4 z-20 p-1.5 rounded-full transition-all 
                  ${current.type === 'generic' ? 'text-gray-400 hover:bg-gray-100' : 'text-white/50 hover:bg-white/20 hover:text-white'}`}
              >
                <X className="w-4 h-4" />
              </button>
              {/* Navigation Arrows */}


              {/* Unique Designs for Desktop */}
              {current.type === 'admission' && (
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl shadow-emerald-900/20 border-b-4 border-emerald-800 ring-1 ring-inset ring-white/20 hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-emerald-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/80">
                      {t('ann_typeAdmission')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-tight mb-4">{current.title}</h3>
                  <div className="space-y-2 mb-4">
                    {current.content.groups?.map((g: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg text-xs font-medium">
                        <span>{g.name}</span>
                        <span className="text-emerald-200">{g.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{currentIndex + 1} / {announcements.length}</span>
                    <button onClick={nextAnn} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {current.type === 'discount' && (
                <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-orange-600 text-white p-6 relative rounded-3xl shadow-xl shadow-rose-900/20 border-2 border-dashed border-rose-300/50 ring-1 ring-inset ring-white/20 hover:scale-[1.02] transition-transform duration-300">
                   <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-rose-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/80">
                      {t('ann_typeDiscount')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-tight mb-4">{current.title}</h3>
                  <div className="space-y-2 mb-4">
                    {current.content.discounts?.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border-b border-rose-400 pb-2 text-xs">
                        <span className="font-bold">{d.course}</span>
                        <span className="bg-white text-rose-600 px-2 py-0.5 rounded-full font-black">-{d.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{currentIndex + 1} / {announcements.length}</span>
                    <button onClick={nextAnn} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {current.type === 'generic' && (
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100/50 hover:scale-[1.02] transition-transform duration-300">
                  {current.image_url && (
                    <div className="aspect-video mb-4 rounded-2xl overflow-hidden shadow-inner border border-blue-100/30">
                      <img src={current.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/40">
                      {t('ann_typeGeneric')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight mb-4">{current.title}</h3>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentIndex + 1} / {announcements.length}</span>
                    <button onClick={nextAnn} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-full transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Mobile Container */}
        <div className="md:hidden">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4"
          >
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className="min-w-full snap-center"
              >
                {/* Mobile specific horizontal designs */}
                <div className={`p-4 rounded-3xl shadow-2xl flex items-start justify-between gap-4 border-2 ring-1 ring-inset ring-white/10
                  ${ann.type === 'admission' ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border-emerald-400 text-white shadow-emerald-900/20' :
                    ann.type === 'discount' ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-600 border-rose-400 text-white shadow-rose-900/20' :
                    'bg-gradient-to-br from-white to-blue-50 border-blue-100 text-gray-900 shadow-blue-900/5'}
                `}>
                  {/* Mobile Close Button - Now in flow and aligned */}
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="shrink-0 p-1 text-gray-400 hover:text-gray-900 mt-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1 block">
                      {ann.type === 'admission' ? t('ann_typeAdmission') : 
                       ann.type === 'discount' ? t('ann_typeDiscount') : 
                       t('ann_typeGeneric')}
                    </span>
                    
                    {!showMobileContent ? (
                      <h4 className="font-black text-sm truncate">{ann.title}</h4>
                    ) : (
                      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {ann.type === 'admission' && ann.content.groups?.slice(0, 2).map((g: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[10px] font-medium opacity-90">
                            <span className="truncate mr-2">{g.name}</span>
                            <span className="shrink-0">{g.time}</span>
                          </div>
                        ))}
                        {ann.type === 'discount' && ann.content.discounts?.slice(0, 2).map((d: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[10px] font-medium opacity-90">
                            <span className="truncate mr-2">{d.course}</span>
                            <span className="font-bold">-{d.amount}</span>
                          </div>
                        ))}
                        {ann.type === 'generic' && (
                          <p className="text-[10px] font-medium line-clamp-2 opacity-90">{ann.title}</p>
                        )}
                        {(ann.type === 'admission' && (!ann.content.groups || ann.content.groups.length === 0)) ||
                         (ann.type === 'discount' && (!ann.content.discounts || ann.content.discounts.length === 0)) ? (
                          <p className="text-[10px] opacity-70 italic">No details available</p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <button 
                      onClick={() => setShowMobileContent(!showMobileContent)}
                      className={`p-2 rounded-full transition-all ${ann.type === 'generic' ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'} ${showMobileContent ? 'ring-2 ring-white/50' : ''}`}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {announcements.length > 1 && (
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">
                        {currentIndex + 1} / {announcements.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Mobile Indicators */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {announcements.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300'}`} 
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
