import { useState, useEffect } from 'react';
import { School, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/i18n';

const languageLabels: Record<Language, string> = {
  en: 'EN',
  uz: 'UZ',
  ru: 'RU',
};

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <School className={`w-8 h-8 ${isScrolled ? 'text-blue-600' : 'text-white drop-shadow-md'}`} />
          <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900' : 'text-white drop-shadow-md'}`}>
            Ar-Roshidoniy
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className={`flex rounded-full overflow-hidden border text-sm font-semibold ${
            isScrolled ? 'border-gray-200' : 'border-white/30'
          }`}>
            {(Object.keys(languageLabels) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 transition-all duration-200 ${
                  language === lang
                    ? isScrolled
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/30 text-white'
                    : isScrolled
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>

          {/* Login Button */}
          <Link
            to="/login"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${
              isScrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{t('login')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
