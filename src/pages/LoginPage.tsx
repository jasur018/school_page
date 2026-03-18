import { useState } from 'react';
import { ArrowLeft, School, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loginCredential, setLoginCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let finalEmail = loginCredential.trim();
      if (!finalEmail.includes('@')) {
        const cleanUsername = finalEmail.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        finalEmail = `${cleanUsername}@school.local.com`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || profile.role !== role) {
          await supabase.auth.signOut();
          throw new Error(t('wrongCredentials'));
        }

        if (role === 'admin') navigate('/admin');
        else navigate('/student');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(t('wrongCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 z-0">
        <img src="/school_hero.png" alt="School building" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white/90 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          {t('backToHome')}
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <School className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t('welcomeBack')}</h2>
            <p className="text-gray-500 mt-2">{t('portalAccess')}</p>
          </div>

          {/* Role Selection Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex mb-8">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('studentTab')}
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('adminTab')}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {role === 'student' ? 'Student Username or Email' : 'Admin Username or Email'}
              </label>
              <input
                type="text"
                value={loginCredential}
                onChange={(e) => setLoginCredential(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={role === 'student' ? 'e.g., student_name or email@example.com' : 'e.g., admin_name or email@example.com'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:transform-none disabled:cursor-not-allowed"
            >
              {isLoading ? t('loggingIn') : t('logIn')}
            </button>
          </form>

          {role === 'student' && (
            <div className="mt-6 text-center text-sm text-gray-600">
              {t('notAStudent')}{' '}
              <Link to="/" className="text-blue-600 hover:underline font-semibold">
                {t('applyNow')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
