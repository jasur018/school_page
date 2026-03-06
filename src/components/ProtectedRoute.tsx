import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'student';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const { t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        console.warn('ProtectedRoute: No active session found.');
        setStatus('unauthorized');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('ProtectedRoute: Failed to fetch profile.', profileError.message);
        setStatus('unauthorized');
        return;
      }

      if (profile && profile.role === requiredRole) {
        setStatus('authorized');
      } else {
        console.warn(`ProtectedRoute: Role mismatch. Got '${profile?.role}', required '${requiredRole}'.`);
        setStatus('unauthorized');
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">{t('verifyingAccess')}</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
