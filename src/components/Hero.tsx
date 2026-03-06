import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  const scrollToApplications = () => {
    const element = document.getElementById('applications');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/school_hero.png"
          alt="School building"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-lg">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto drop-shadow-md">
            {t('heroSubtitle')}
          </p>
          <button
            onClick={scrollToApplications}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {t('applyNow')}
          </button>
        </div>

        <div className="absolute bottom-8 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}
