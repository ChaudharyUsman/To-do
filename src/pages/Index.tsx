
import { useEffect, useState } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import Dashboard from '@/pages/Dashboard';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const [session, setSession] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(!!data.session);
      } catch (error) {
        console.error('Error checking auth session:', error);
        setSession(false);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return session ? (
    <Dashboard />
  ) : (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/images/stars-bg.png')] bg-cover">
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-primary/20 z-0"></div>
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-2 float-animation">
          <h1 className="text-3xl md:text-5xl font-extrabold gradient-text">
            Cosmic Tasks
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered task management universe
          </p>
        </div>
        
        <AuthForm />
        
        <div className="text-sm text-center text-white/60">
          <p>Organize your tasks with the help of AI</p>
          <p className="mt-2">Tasks are securely stored in the cloud</p>
        </div>
      </div>
    </div>
  );
}
