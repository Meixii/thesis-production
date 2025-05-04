import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SocialButton from '../components/ui/SocialButton';
import Divider from '../components/ui/Divider';
import { ValidationError } from '../utils/validation';

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  [key: string]: ValidationError | null;
}

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validateLoginForm = (formData: LoginForm): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.email) {
      errors.email = { field: 'email', message: 'Email is required' };
    }
    if (!formData.password) {
      errors.password = { field: 'password', message: 'Password is required' };
    }
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const errors = validateLoginForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Email or password may be invalid or does not exist');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'finance_coordinator') {
        navigate('/dashboard/fc');
      } else {
        navigate('/dashboard/student');
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async (provider: 'facebook' | 'google') => {
    try {
      window.location.href = `http://localhost:5000/api/auth/${provider}`;
    } catch (err) {
      setServerError('Failed to initialize SSO login');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4 sm:px-6 lg:px-8">
      <Card
        title="Welcome Back"
        subtitle="Thesis Finance Tracker"
        className="w-full max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <SocialButton
              provider="facebook"
              onClick={() => handleSSOLogin('facebook')}
            />
            <SocialButton
              provider="google"
              onClick={() => handleSSOLogin('google')}
            />
          </div>

          <Divider text="Or continue with" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            {serverError && (
              <div className="rounded-md bg-error-light/10 p-4">
                <div className="text-sm text-error-dark">{serverError}</div>
              </div>
            )}
            
            <div className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
              />
              
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                  Forgot your password?
                </a>
              </div>
              <div className="text-sm">
                <a href="/register" className="font-medium text-primary hover:text-primary-dark">
                  Create an account
                </a>
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
        </div>
      </Card>
    </div>
  );
};

export default Login; 