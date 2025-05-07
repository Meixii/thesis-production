import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
          <div className="mt-3 mb-6">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex items-center justify-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Back to Home
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Go Back
          </Button>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Made by Zen Garden 2025 Thesis Financial Tracker • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}