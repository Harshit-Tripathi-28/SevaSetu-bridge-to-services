import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserCheck, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide an email address and password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await register({
        fullName: fullName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });

      // Role-aware initial navigation
      if (user.role === 'PROVIDER') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to complete registration. Please try again.';
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
          <span>Join SevaSetu</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
          Sign up to connect with trusted local service providers or offer skilled services in your neighborhood.
        </p>
      </div>

      <Card variant="default" padding="lg" className="bg-white shadow-sm border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Register</CardTitle>
          <CardDescription>Select your account type and fill in your details.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Registration Error">
                {errorMessage}
              </Alert>
            )}

            {/* Role Selection Pill Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                    role === 'CUSTOMER'
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold ring-1 ring-primary-500'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <UserCheck size={16} className={role === 'CUSTOMER' ? 'text-primary-600' : 'text-neutral-400'} />
                  <span>Customer (Hire Services)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PROVIDER')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                    role === 'PROVIDER'
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold ring-1 ring-primary-500'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Briefcase size={16} className={role === 'PROVIDER' ? 'text-primary-600' : 'text-neutral-400'} />
                  <span>Service Provider (Partner)</span>
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Full Name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User size={16} className="text-neutral-400" />}
                disabled={isLoading}
              />
            </div>

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
                label="Phone Number (Optional)"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone size={16} className="text-neutral-400" />}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters (A-Z, a-z, 0-9)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} className="text-neutral-400" />}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              rightIcon={<ArrowRight size={16} />}
            >
              Complete Registration
            </Button>

            <div className="text-center text-xs text-neutral-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                Sign in instead
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </PageContainer>
  );
};
