import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from '../hooks/useForm';
import { LoginCredentials } from '../utils/types';

// Define validation schema for login form
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Initialize form with validation
  const { 
    values, 
    errors, 
    touched,
    isSubmitting,
    handleChange, 
    handleBlur, 
    handleSubmit 
  } = useForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    schema: loginSchema,
    onSubmit: async (values) => {
      try {
        await login(values);
      } catch (error) {
        // Error is handled by the auth context
        console.error('Login error:', error);
      }
    },
  });
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-h2 font-bold text-primary-500">
            {t('creator.auth.title')}
          </h1>
          <p className="text-neutral-500">
            {t('creator.auth.signInPrompt')}
          </p>
        </div>
        
        {authError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
            {authError}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            label={t('creator.auth.email')}
            placeholder="name@example.com"
            fullWidth
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email ? errors.email : undefined}
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            label={t('creator.auth.password')}
            fullWidth
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password ? errors.password : undefined}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                checked={values.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-neutral-700">
                {t('creator.auth.rememberMe')}
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="font-medium text-primary-500 hover:text-primary-600">
                {t('creator.auth.forgotPassword')}
              </a>
            </div>
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            disabled={isSubmitting || isLoading}
            isLoading={isSubmitting || isLoading}
          >
            {t('creator.auth.signIn')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;