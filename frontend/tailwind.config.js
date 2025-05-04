/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Main brand colors with expanded palette for accessibility and clarity
        primary: {
          50:  '#e6f6f7',
          100: '#b3e6e8',
          200: '#80d6d9',
          300: '#4dc6ca',
          400: '#1ab6bb',
          500: '#0C969C',   // main
          600: '#06787b',
          700: '#032F30',   // dark
          800: '#031716',
          900: '#011010',
        },
        secondary: {
          50:  '#f2f8fa',
          100: '#d6eaf2',
          200: '#b9dceb',
          300: '#9ccfe3',
          400: '#80c1db',
          500: '#6BA3BE',   // main
          600: '#4e7e97',
          700: '#274D60',   // dark
          800: '#1a3440',
          900: '#10212a',
        },
        accent: {
          50:  '#e6fcfc',
          100: '#b3f3f5',
          200: '#80eaee',
          300: '#4de1e7',
          400: '#1ad8e0',
          500: '#10BCC3',   // light
          600: '#0C969C',   // main
          700: '#0A7075',   // dark
          800: '#075357',
          900: '#04393b',
        },
        neutral: {
          50:  '#fafbfc',
          100: '#f4f5f7',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Semantic colors
        success: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
        error: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        info: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
        },
        // Background and text colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
        text: {
          primary: '#111827',
          secondary: '#374151',
          tertiary: '#6B7280',
          inverse: '#FFFFFF',
        }
      },
      // Font settings
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      // Custom spacing for mobile-first design
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Custom border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      // Box shadows optimized for mobile
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'hard': '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
      // Screen breakpoints (mobile-first)
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

