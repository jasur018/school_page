import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('adminDashboardTitle')}</h1>
        <p className="text-lg text-gray-600 mb-8">{t('adminDashboardDesc')}</p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 py-3 rounded-lg font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('logOut')}
        </button>
      </div>
    </div>
  );
}
