import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  header,
  sidebar,
  footer
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-30 w-full">
          {header}
        </header>
      )}

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-700">
            <div className="sticky top-16 overflow-y-auto h-[calc(100vh-4rem)]">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-gray-200 dark:border-gray-700">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default Layout; 