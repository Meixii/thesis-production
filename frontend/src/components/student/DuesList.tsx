import { useState } from 'react';
import { Due } from '../../types/student';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface DuesListProps {
  dues: Due[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onViewDetails: (dueId: number) => void;
}

const DuesList = ({ dues, loading, error, onRefresh, onViewDetails }: DuesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDues = dues.filter(due => {
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      due.title.toLowerCase().includes(searchLower) ||
      (due.description?.toLowerCase().includes(searchLower) || '') ||
      due.status.toLowerCase().replace('_', ' ').includes(searchLower) ||
      due.totalAmountDue.toString().includes(searchLower) ||
      (due.dueDate && new Date(due.dueDate).toLocaleDateString().toLowerCase().includes(searchLower))
    );
  });

  return (
    <Card variant="default" className="w-full max-w-7xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Assigned Dues
            </h3>
            <button 
              onClick={onRefresh}
              className="p-2 rounded-lg text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
              title="Refresh dues"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {dues.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {/* Results count */}
              {searchQuery && (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Found {filteredDues.length} of {dues.length} dues
                </div>
              )}
              <div className="relative group w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search dues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64 transition-all duration-200 ease-in-out"
                  aria-label="Search dues"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-1"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-300 text-center">Loading dues...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 text-center font-medium mb-2">Failed to load dues</p>
            <p className="text-neutral-600 dark:text-neutral-300 text-center text-sm">{error}</p>
            <Button 
              variant="primary"
              onClick={onRefresh}
              className="mt-4 px-4 py-2"
            >
              Try Again
            </Button>
          </div>
        ) : dues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-neutral-900 dark:text-white text-center font-semibold mb-2">No dues assigned yet</p>
            <p className="text-neutral-600 dark:text-neutral-300 text-center text-sm">You're all caught up! Check back later for new assignments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-3">
              {filteredDues.map(due => (
                <div key={due.userDueId} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">{due.title}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Due: {due.dueDate ? new Date(due.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0
                      ${due.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : due.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : due.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                    `}>
                      {due.status === 'paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      {due.status === 'overdue' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {due.status === 'partially_paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {due.status === 'pending' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {due.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Total</div>
                      <div className="font-semibold text-neutral-900 dark:text-white text-sm">₱{due.totalAmountDue.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Paid</div>
                      <div className="font-semibold text-green-600 dark:text-green-400 text-sm">₱{due.amountPaid.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</div>
                      <div className="font-semibold text-red-600 dark:text-red-400 text-sm">₱{due.remaining.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onViewDetails(due.dueId)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50 rounded-tl-lg">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50">Remaining</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800/50 rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredDues.map(due => (
                    <tr key={due.userDueId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{due.title}</td>
                      <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.totalAmountDue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{due.dueDate ? new Date(due.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                          ${due.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : due.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : due.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                        `}>
                          {due.status === 'paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          {due.status === 'overdue' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {due.status === 'partially_paid' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {due.status === 'pending' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {due.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.amountPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">₱{due.remaining.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewDetails(due.dueId)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DuesList;
