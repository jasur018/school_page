-- Fix: Remove recursive policy that causes login failure
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Note: Admins can still view their OWN profile due to the 
-- "Users can view own profile" policy, which is sufficient for login.
