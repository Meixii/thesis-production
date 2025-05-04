import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Divider from '../components/ui/Divider';
import SocialButton from '../components/ui/SocialButton';
import { getApiUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases with clearer messages
        if (response.status === 401) {
          if (data.error.includes('verify your email')) {
            throw new Error('Please verify your email address before logging in');
          } else {
            throw new Error('Invalid email or password');
          }
        }
        throw new Error(data.error || 'Failed to login');
      }

      localStorage.setItem('token', data.token);
      showToast('Logged in successfully!', 'success');
      navigate('/dashboard/student');
    } catch (err) {
      // Handle the specific "Illegal arguments" error that appears when email doesn't exist
      if (err instanceof Error && err.message.includes('Illegal arguments: string, object')) {
        setError('Invalid email or password');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
          Welcome back!
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="default" className="py-8 px-4 shadow-medium sm:rounded-xl sm:px-10 bg-white dark:bg-neutral-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-500 hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              loadingText="Signing in..."
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          <Divider className="my-6">Or continue with</Divider>

          <div className="grid grid-cols-2 gap-3">
            <SocialButton
              provider="google"
              onClick={() => window.location.href = getApiUrl('/api/auth/google')}
            >
              Google
            </SocialButton>
            <SocialButton
              provider="facebook"
              onClick={() => window.location.href = getApiUrl('/api/auth/facebook')}
            >
              Facebook
            </SocialButton>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-300">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-500 hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign up
            </Link>
          </p>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Made by Zen Garden 2025 - Thesis Financial Tracker
      </footer>
    </div>
  );
};

export default Login; 