import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Location state can contain attempted route
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email: email.trim(), password });

      // Deterministic redirect: either to destination user attempted or their role home
      if (fromLocation && fromLocation !== '/login') {
        navigate(fromLocation, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'PROVIDER') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to log in. Please check your credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="sm" className="py-12 sm:py-16">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-800 text-xs font-semibold">
          <ShieldCheck size={14} className="text-primary-600" />
          <span>Secure Platform Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Welcome back to SevaSetu
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
          Sign in to access your booked services, incoming dispatches, or operational console.
        </p>
      </div>

      <Card variant="default" padding="lg" className="bg-white shadow-sm border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sign In</CardTitle>
          <CardDescription>Enter your verified credentials below.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Authentication Failed">
                {errorMessage}
              </Alert>
            )}

            <div>
              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} className="text-neutral-400" />}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} className="text-neutral-400" />}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4 border-t border-neutral-100">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              isLoading={isLoading}
              leftIcon={<LogIn size={16} />}
            >
              Sign In
            </Button>

            <div className="text-center text-xs text-neutral-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </PageContainer>
  );
};
