export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  profilePictureUrl?: string;
  role: string;
  groupId: number;
  emailVerified: boolean;
}

export interface Group {
  id: number;
  name: string;
  groupType: string;
}

export interface Due {
  userDueId: number;
  dueId: number;
  title: string;
  description: string;
  totalAmountDue: number;
  dueDate: string;
  paymentMethodRestriction?: 'all' | 'online_only' | 'cash_only';
  status: string;
  amountPaid: number;
  remaining: number;
  createdAt: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  isEmergency: boolean;
}

export interface ExpenseRequest {
  id: number;
  categoryId: number;
  category: ExpenseCategory;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  isEmergency: boolean;
  repaymentDeadline?: string;
  repaymentAmount?: number;
  proofRequired: boolean;
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
}

export interface ExpenseProof {
  id: number;
  expenseRequestId: number;
  proofType: 'receipt' | 'photo' | 'document';
  fileUrl: string;
  uploadedBy: number;
  verified: boolean;
  verifiedBy?: number;
  verifiedAt?: string;
  createdAt: string;
}

export interface ExpenseRepayment {
  id: number;
  expenseRequestId: number;
  amount: number;
  paymentMethod: string;
  referenceId?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: number;
  verifiedAt?: string;
  createdAt: string;
}
