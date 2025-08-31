import { Due } from '../../types/student';
import Card from '../ui/Card';

interface FinancialSummaryProps {
  dues: Due[];
}

const FinancialSummary = ({ dues }: FinancialSummaryProps) => {
  // Dues summary calculations
  const totalDues = dues.length;
  const paidDues = dues.filter(d => d.status === 'paid').length;
  const overdueDues = dues.filter(d => d.status === 'overdue').length;
  const unpaidDues = dues.filter(d => d.status === 'pending').length;
  const partialDues = dues.filter(d => d.status === 'partially_paid').length;
  const totalAmountDue = dues.reduce((sum, d) => sum + d.totalAmountDue, 0);
  const totalPaid = dues.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalRemaining = dues.reduce((sum, d) => sum + d.remaining, 0);

  return (
    <Card variant="default" className="w-full max-w-7xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 shadow-xl">
      <div className="p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Financial Summary
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Badges */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3">Dues Status</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-lg font-bold">{totalDues}</span>
                <span className="text-xs opacity-90">Assigned</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-lg font-bold">{paidDues}</span>
                <span className="text-xs opacity-90">Paid</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold">{unpaidDues + partialDues}</span>
                <span className="text-xs opacity-90">Unpaid</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold">{overdueDues}</span>
                <span className="text-xs opacity-90">Overdue</span>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-3">Financial Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Due</span>
                </div>
                <span className="font-bold text-blue-900 dark:text-blue-100">₱{totalAmountDue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Paid</span>
                </div>
                <span className="font-bold text-green-900 dark:text-green-100">₱{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Remaining</span>
                </div>
                <span className="font-bold text-red-900 dark:text-red-100">₱{totalRemaining.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FinancialSummary;
