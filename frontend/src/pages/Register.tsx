import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SocialButton from '../components/ui/SocialButton';
import Divider from '../components/ui/Divider';
import { validateEmail, validatePassword, validateName, validateConfirmPassword, ValidationError } from '../utils/validation';

interface RegisterForm {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: ValidationError | null;
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ssoEmail = searchParams.get('email');
  const ssoProvider = searchParams.get('provider');
  const ssoId = searchParams.get('id');

  const [formData, setFormData] = useState<RegisterForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: ssoEmail || '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      firstName: validateName(formData.firstName, 'firstName'),
      lastName: validateName(formData.lastName, 'lastName'),
      middleName: formData.middleName ? validateName(formData.middleName, 'middleName') : null,
      email: validateEmail(formData.email),
      password: !ssoProvider ? validatePassword(formData.password) : null,
      confirmPassword: !ssoProvider ? validateConfirmPassword(formData.password, formData.confirmPassword) : null
    };

    // Remove null errors (optional fields)
    Object.keys(errors).forEach(key => {
      if (errors[key] === null) {
        delete errors[key];
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ssoProvider,
          ssoId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (ssoProvider) {
        // For SSO users, we can log them in directly
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard/student');
      } else {
        // For traditional registration, show verification message
        setSuccessMessage('Registration successful! Please check your email for verification link.');
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
        title={ssoProvider ? 'Complete Your Profile' : 'Create an Account'}
        subtitle="Thesis Finance Tracker"
        className="w-full max-w-md"
      >
        <div className="space-y-6">
          {!ssoProvider && (
            <>
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

              <Divider text="Or register with email" />
            </>
          )}

          {successMessage ? (
            <div className="rounded-md bg-success-light/10 p-4 flex flex-col items-center space-y-2">
              <div className="text-sm text-success-dark">{successMessage}</div>
              <div className="text-xs text-text-secondary">You may now close this tab or go to the login page.</div>
              <button
                onClick={() => navigate('/login')}
                className="mt-2 text-primary hover:text-primary-dark font-medium"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {serverError && (
                <div className="rounded-md bg-error-light/10 p-4">
                  <div className="text-sm text-error-dark">{serverError}</div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    label="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    error={formErrors.firstName}
                  />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    label="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    error={formErrors.lastName}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="middleName"
                    name="middleName"
                    type="text"
                    label="Middle Name"
                    value={formData.middleName}
                    onChange={handleChange}
                    error={formErrors.middleName}
                  />
                  <Input
                    id="suffix"
                    name="suffix"
                    type="text"
                    label="Suffix"
                    placeholder="Jr., Sr., III"
                    value={formData.suffix}
                    onChange={handleChange}
                  />
                </div>

                {!ssoProvider && (
                  <>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email address"
                      required
                      autoComplete="email"
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
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      error={formErrors.password}
                      helperText="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character."
                    />

                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label="Confirm Password"
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={formErrors.confirmPassword}
                    />
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Already have an account?{' '}
                  <a href="/login" className="font-medium text-primary hover:text-primary-dark">
                    Sign in
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                loadingText="Creating account..."
                className="w-full"
              >
                {ssoProvider ? 'Complete Registration' : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Register; 