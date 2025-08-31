import { useState } from 'react';

import { getApiUrl } from '../utils/api';

interface ExpenseFormData {
  categoryId: string;
  title: string;
  description: string;
  amount: string;
}

interface ExpenseFormErrors {
  categoryId?: string;
  title?: string;
  description?: string;
  amount?: string;
  submit?: string;
}

interface UseExpenseFormResult {
  formData: ExpenseFormData;
  errors: ExpenseFormErrors;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const initialFormData: ExpenseFormData = {
  categoryId: '',
  title: '',
  description: '',
  amount: ''
};

export const useExpenseForm = (
  onSuccess: () => void,
  onError: (error: string) => void
): UseExpenseFormResult => {
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ExpenseFormErrors = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be at most 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ExpenseFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(getApiUrl('/api/student/expenses'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create expense request');
      }

      onSuccess();
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit expense request';
      setErrors({ submit: errorMessage });
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm
  };
};
