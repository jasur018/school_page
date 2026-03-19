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
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout>;
    const abortController = new AbortController();

    const checkAuth = async () => {
      try {
        // Add a 35-second timeout to accommodate Supabase Free Tier cold starts (usually ~20-30s)
        timeout = setTimeout(() => {
          if (mounted) {
            console.error('ProtectedRoute: Auth check timed out after 35 seconds');
            setStatus('unauthorized');
          }
        }, 35000);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !session.user) {
          console.warn('ProtectedRoute: No active session found.');
          clearTimeout(timeout);
          if (mounted) setStatus('unauthorized');
          return;
        }

        if (!mounted) return;

        // OPTIMIZATION: Check JWT metadata for the role first to skip the database query completely 
        // This makes role verification instant and entirely avoids cold-start delays for routing!
        const jwtRole = session.user.user_metadata?.role;
        
        if (jwtRole) {
          clearTimeout(timeout);
          if (jwtRole === requiredRole) {
            setStatus('authorized');
          } else {
            console.warn(`ProtectedRoute: Role mismatch in JWT. Got '${jwtRole}', required '${requiredRole}'.`);
            setStatus('unauthorized');
          }
          return;
        }

        // FALLBACK: Query the database if JWT doesn't have the role (legacy accounts)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .abortSignal(abortController.signal)
          .single();

        clearTimeout(timeout);

        if (!mounted) return;

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
      } catch (err: any) {
        clearTimeout(timeout);
        
        // Ignore AbortError as it's an intended cancellation during Strict Mode unmount
        if (err?.name === 'AbortError') return;

        if (mounted) {
          console.error('ProtectedRoute: Unexpected error during auth check', err);
          setStatus('unauthorized');
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      abortController.abort();
      if (timeout) clearTimeout(timeout);
    };
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
