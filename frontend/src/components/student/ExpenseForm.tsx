import { ExpenseCategory } from '../../types/student';
import Button from '../ui/Button';
import { useExpenseForm } from '../../hooks/useExpenseForm';

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  onSuccess: () => void;
  onError: (error: string) => void;
}

const ExpenseForm = ({ categories, onSuccess, onError }: ExpenseFormProps) => {
  const {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useExpenseForm(onSuccess, onError);

  console.log('ExpenseForm categories:', categories);

  // Show loading state if categories are not loaded
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.title ? 'border-red-300 dark:border-red-700' : 'border-neutral-300 dark:border-neutral-700'
          } bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
          placeholder="Enter expense title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className={`mt-1 block w-full rounded-lg border ${
            errors.description ? 'border-red-300 dark:border-red-700' : 'border-neutral-300 dark:border-neutral-700'
          } bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
          placeholder="Describe the expense and its purpose"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Category
        </label>
        <select
          id="category"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.categoryId ? 'border-red-300 dark:border-red-700' : 'border-neutral-300 dark:border-neutral-700'
          } bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name} {category.isEmergency ? '(Emergency)' : ''}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoryId}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Amount (₱)
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="0"
          step="0.01"
          className={`mt-1 block w-full rounded-lg border ${
            errors.amount ? 'border-red-300 dark:border-red-700' : 'border-neutral-300 dark:border-neutral-700'
          } bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
        )}
      </div>

      {errors.submit && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          {errors.submit}
        </div>
      )}

      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          className="w-full text-base py-3 font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
