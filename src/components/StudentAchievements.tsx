import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useRef } from 'react';

const achievements = [
  {
    id: 13,
    name: 'Hoshimov Xondamirjon',
    score: 'A+',
    image: '/certificates/photo_20_2026-04-20_17-06-50.jpg'
  },
  {
    id: 14,
    name: 'Keldiboyev Islomjon',
    score: 'A+',
    image: '/certificates/photo_21_2026-04-20_17-06-50.jpg'
  },
  {
    id: 1,
    name: "Homidov G'anisher",
    score: 'B',
    image: '/certificates/photo_7_2026-04-20_17-06-50.jpg'
  },
  {
    id: 2,
    name: 'Saloxiddinov Odilbek',
    score: 'B',
    image: '/certificates/photo_8_2026-04-20_17-06-50.jpg'
  },
  {
    id: 3,
    name: 'Jabborov Alisher',
    score: 'B',
    image: '/certificates/photo_9_2026-04-20_17-06-50.jpg'
  },
  {
    id: 4,
    name: 'Mashrabov Sayyodbek',
    score: 'B',
    image: '/certificates/photo_12_2026-04-20_17-06-50.jpg'
  },
  {
    id: 7,
    name: 'Ashuraliyev Diyorbek',
    score: 'B',
    image: '/certificates/photo_15_2026-04-20_17-06-50.jpg'
  },
  {
    id: 9,
    name: 'Janobiddinov Sayoxiddin',
    score: 'B',
    image: '/certificates/photo_17_2026-04-20_17-06-50.jpg'
  },
  {
    id: 12,
    name: 'Solijonov Sherzodbek',
    score: 'B',
    image: '/certificates/photo_19_2026-04-20_17-06-50.jpg'
  },
  {
    id: 5,
    name: 'Yusufov Yahyoxon',
    score: 'C+',
    image: '/certificates/photo_13_2026-04-20_17-06-50.jpg'
  },
  {
    id: 6,
    name: 'Ergashev Bekzod',
    score: 'C+',
    image: '/certificates/photo_14_2026-04-20_17-06-50.jpg'
  },
  {
    id: 8,
    name: 'Ahmadaliyeva Shabnam',
    score: 'C+',
    image: '/certificates/photo_16_2026-04-20_17-06-50.jpg'
  },
  {
    id: 11,
    name: "Ro'zialiyev Murodilbek",
    score: 'C',
    image: '/certificates/photo_18_2026-04-20_17-06-50.jpg'
  }
];

export default function StudentAchievements() {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('studentAchievements')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              {t('studentAchievementsDesc')}
            </p>
          </div>
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => scroll('left')}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all hover:border-blue-200 hover:text-blue-600 shadow-sm"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all hover:border-blue-200 hover:text-blue-600 shadow-sm"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-10 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {achievements.map((item) => (
            <div 
              key={item.id}
              className="min-w-[300px] md:min-w-[340px] snap-center bg-gray-50 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:scale-[1.02] duration-300"
            >
              <div className="w-full flex justify-start mb-4">
                <Star className="w-6 h-6 text-gray-400" />
              </div>
              
              <div className="w-full aspect-[4/5] bg-white rounded-3xl overflow-hidden shadow-inner mb-8 border border-gray-200 flex items-center justify-center">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="w-full space-y-1">
                <h3 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                  {item.name}
                </h3>
                <div className="text-7xl font-black text-[#E86B32] py-4 tabular-nums">
                  {item.score}
                </div>
                <div className="w-full border-t border-gray-200 pt-4 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                    Certificate Level
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom scroll progress indicator for mobile */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          <div className="h-1 w-12 bg-blue-600 rounded-full" />
          <div className="h-1 w-2 bg-gray-200 rounded-full" />
          <div className="h-1 w-2 bg-gray-200 rounded-full" />
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
