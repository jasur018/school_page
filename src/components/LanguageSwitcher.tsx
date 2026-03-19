import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/i18n';

const languageLabels: Record<Language, string> = {
  en: 'EN',
  uz: 'UZ',
  ru: 'RU',
};

interface LanguageSwitcherProps {
  theme?: 'light' | 'dark' | 'glass';
}

export default function LanguageSwitcher({ theme = 'light' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const getContainerStyles = () => {
    switch (theme) {
      case 'dark':
        return 'border-gray-600 bg-gray-800';
      case 'glass':
        return 'border-white/30 bg-black/10 backdrop-blur-md';
      case 'light':
      default:
        return 'border-gray-200 bg-white shadow-sm';
    }
  };

  const getButtonStyles = (isActive: boolean) => {
    if (isActive) {
      return theme === 'light' ? 'bg-blue-600 text-white shadow' : 'bg-white/30 text-white';
    }
    switch (theme) {
      case 'dark':
        return 'text-gray-300 hover:bg-gray-700/50';
      case 'glass':
        return 'text-white/90 hover:text-white hover:bg-white/20';
      case 'light':
      default:
        return 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
    }
  };

  return (
    <div className={`flex rounded-full overflow-hidden border text-xs sm:text-sm font-bold transition-colors ${getContainerStyles()}`}>
      {(Object.keys(languageLabels) as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 ${getButtonStyles(language === lang)}`}
        >
          {languageLabels[lang]}
        </button>
      ))}
    </div>
  );
}
