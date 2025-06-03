import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
// import Divider from '../components/ui/Divider';
// import SocialButton from '../components/ui/SocialButton';
import { getApiUrl } from '../../utils/api';
import { validatePassword, validateEmail, type PasswordValidation } from '../../utils/validation';

interface RegisterFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [emailError, setEmailError] = useState('');
  // const [lastNameError, setLastNameError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [searchParams] = useSearchParams();
  const ssoProvider = searchParams.get('provider');
  const ssoId = searchParams.get('id');
  const ssoEmail = searchParams.get('email');
  const ssoFirstName = searchParams.get('firstName');
  const ssoLastName = searchParams.get('lastName');

  useEffect(() => {
    if (formData.password) {
      setPasswordValidation(validatePassword(formData.password));
    }
  }, [formData.password]);

  useEffect(() => {
    if (formData.email) {
      const validation = validateEmail(formData.email);
      setEmailError(validation.isValid ? '' : validation.message || '');
    }
  }, [formData.email]);

  useEffect(() => {
    if (ssoProvider) {
      setFormData((prev) => ({
        ...prev,
        email: ssoEmail || '',
        firstName: ssoFirstName || '',
        lastName: ssoLastName || '',
      }));
    }
  }, [ssoProvider, ssoEmail, ssoFirstName, ssoLastName]);

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
      const payload = {
        ...formData,
        ssoProvider: ssoProvider || undefined,
        ssoId: ssoId || undefined,
      };
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      // On success, always redirect to verify email page, passing the email
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex flex-col justify-center py-8 px-2 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
          Join us to manage your thesis finances
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-sm">
        <Card variant="default" className="py-8 px-3 sm:px-6 shadow-medium sm:rounded-xl bg-white dark:bg-neutral-800">
          {/* <div className="grid grid-cols-2 gap-3">
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

          <Divider className="my-6">Or register with email</Divider> */}

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
                disabled={!!ssoProvider}
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
                disabled={!!ssoProvider}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                id="middleName"
                name="middleName"
                type="text"
                label="Middle name (optional)"
                autoComplete="additional-name"
                value={formData.middleName}
                onChange={handleChange}
              />

              <Input
                id="suffix"
                name="suffix"
                type="text"
                label="Suffix (optional)"
                placeholder="Jr., Sr., III, etc."
                value={formData.suffix}
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
              error={emailError || undefined}
              disabled={!!ssoProvider}
            />

            <div className="space-y-4">
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

              <div className="text-sm space-y-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Password requirements:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <svg className={`h-4 w-4 mr-2 ${passwordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {passwordValidation.hasMinLength ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <svg className={`h-4 w-4 mr-2 ${passwordValidation.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {passwordValidation.hasUpperCase ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <svg className={`h-4 w-4 mr-2 ${passwordValidation.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {passwordValidation.hasLowerCase ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <svg className={`h-4 w-4 mr-2 ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {passwordValidation.hasNumber ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    One number
                  </li>
                  <li className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600 dark:text-green-400' : ''}`}>
                    <svg className={`h-4 w-4 mr-2 ${passwordValidation.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {passwordValidation.hasSpecialChar ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                  </li>
                </ul>
              </div>
            </div>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : undefined}
            />

            <Button
              type="submit"
              isLoading={isLoading}
              loadingText="Creating account..."
              className="w-full"
              disabled={!passwordValidation.isValid || Boolean(emailError) || formData.password !== formData.confirmPassword}
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