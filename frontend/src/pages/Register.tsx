import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Divider from '../components/ui/Divider';
import SocialButton from '../components/ui/SocialButton';
import { getApiUrl } from '../utils/api';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Registration successful, redirect to verification page
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
          Join us to manage your thesis finances
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="default" className="py-8 px-4 shadow-medium sm:rounded-xl sm:px-10 bg-white dark:bg-neutral-800">
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

          <Divider className="my-6">Or register with email</Divider>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-error-light/10 p-4">
                <p className="text-sm text-error-dark">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                id="firstName"
                name="firstName"
                type="text"
                label="First name"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
              />

              <Input
                id="lastName"
                name="lastName"
                type="text"
                label="Last name"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              isLoading={isLoading}
              loadingText="Creating account..."
              className="w-full"
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-300">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-500 hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in
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

export default Register; 