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
      try {
        // Add a timeout to prevent permanent loading
        const timeout = setTimeout(() => {
          if (status === 'loading') {
            console.error('ProtectedRoute: Auth check timed out');
            setStatus('unauthorized');
          }
        }, 10000);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !session.user) {
          console.warn('ProtectedRoute: No active session found.');
          clearTimeout(timeout);
          setStatus('unauthorized');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        clearTimeout(timeout);

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
      } catch (err) {
        console.error('ProtectedRoute: Unexpected error during auth check', err);
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
