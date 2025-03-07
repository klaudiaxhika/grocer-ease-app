
import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  return (
    <AppLayout>
      <AnimatedContainer animation="fade-up" className="max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                    },
                  },
                },
                className: {
                  button: 'bg-primary hover:bg-primary/90 text-white',
                  input: 'rounded-md border border-input',
                  label: 'text-sm font-medium leading-none',
                },
              }}
              theme="light"
              providers={['google', 'github']}
            />
          </CardContent>
        </Card>
      </AnimatedContainer>
    </AppLayout>
  );
};

export default Login;
