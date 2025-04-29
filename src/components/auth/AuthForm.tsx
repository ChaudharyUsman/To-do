
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Account created successfully!',
          description: 'Please check your email for verification link.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Logged in successfully!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card border-white/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-text">
          {mode === 'login' ? 'Enter Your Universe' : 'Create Your Universe'}
        </CardTitle>
        <CardDescription className="text-white/70">
          {mode === 'login' 
            ? 'Enter your credentials to access your tasks' 
            : 'Sign up for a new account to get started'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> 
                {mode === 'login' ? 'Logging in...' : 'Signing up...'}
              </>
            ) : (
              mode === 'login' ? 'Login' : 'Sign up'
            )}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full text-white/70 hover:text-white hover:bg-white/10" 
            onClick={toggleMode}
            disabled={isLoading}
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
