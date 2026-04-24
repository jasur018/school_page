import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Megaphone, 
  Tag, 
  Clock,
  ArrowRight
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
  const prevAnn = () => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div 
      className="fixed bottom-0 left-0 w-full md:bottom-12 md:left-8 md:w-[21.6rem] z-[60] pointer-events-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pointer-events-auto relative px-4 pb-4 md:px-0 md:pb-0">
        
        {/* Mobile Close Button (Keep outside or as is) */}
        <button 
          onClick={() => setIsVisible(false)}
          className="md:hidden absolute -top-2 -right-2 z-10 bg-white text-gray-400 hover:text-gray-900 shadow-lg border border-gray-100 rounded-full p-1.5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

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
              {announcements.length > 1 && (
                <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
                  <button onClick={prevAnn} className="pointer-events-auto bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 p-2 rounded-full text-gray-600 hover:text-blue-600 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextAnn} className="pointer-events-auto bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 p-2 rounded-full text-gray-600 hover:text-blue-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Unique Designs for Desktop */}
              {current.type === 'admission' && (
                <div className="bg-emerald-600 text-white p-6 [clip-path:polygon(0%_0%,_100%_0%,_100%_85%,_85%_100%,_0%_100%)] shadow-lg border-b-4 border-emerald-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-emerald-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">
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
                <div className="bg-rose-500 text-white p-6 relative [clip-path:polygon(10%_0%,_90%_0%,_100%_10%,_100%_90%,_90%_100%,_10%_100%,_0%_90%,_0%_10%)] shadow-lg border-2 border-dashed border-rose-300">
                   <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-rose-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">
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
                <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-blue-50">
                  {current.image_url && (
                    <div className="aspect-video mb-4 rounded-2xl overflow-hidden shadow-inner">
                      <img src={current.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60">
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
                <div className={`p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 border-2
                  ${ann.type === 'admission' ? 'bg-emerald-600 border-emerald-500 text-white' :
                    ann.type === 'discount' ? 'bg-rose-500 border-rose-400 text-white' :
                    'bg-white border-blue-100 text-gray-900'}
                `}>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1 block">
                      {ann.type === 'admission' ? t('ann_typeAdmission') : 
                       ann.type === 'discount' ? t('ann_typeDiscount') : 
                       t('ann_typeGeneric')}
                    </span>
                    <h4 className="font-black text-sm truncate">{ann.title}</h4>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <button 
                      onClick={nextAnn}
                      className={`p-2 rounded-full transition-all ${ann.type === 'generic' ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                      <ArrowRight className="w-4 h-4" />
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
