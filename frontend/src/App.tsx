import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NotFound from './pages/NotFound';
import AuthCallback from './components/auth/AuthCallback';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import FCDashboard from './pages/dashboard/FCDashboard';
import VerifyEmail from './components/auth/VerifyEmail';
import VerifyEmailInfo from './components/auth/VerifyEmailInfo';
import Payment from './pages/Payment';
import LoanRequest from './pages/LoanRequest';
import MyLoans from './pages/MyLoans';
import PaymentHistory from './pages/PaymentHistory';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Profile from './pages/Profile';
import GroupSettings from './components/fc/GroupSettings';
import Members from './components/fc/Members';
import MemberDetail from './components/fc/MemberDetail';
import Admin from './pages/dashboard/Admin';
import { ToastProvider } from './context/ToastContext';
import './App.css';
import TreasurerDashboard from './components/treasurer/TreasurerDashboard';
import CreateDueForm from './components/treasurer/CreateDueForm';
import DuesList from './components/treasurer/DuesList';
import DueDetails from './components/treasurer/DueDetails';
import PendingPayments from './components/treasurer/PendingPayments';
import ExportData from './components/treasurer/ExportData';
import ChecklistPage from './components/treasurer/ChecklistPage';
import ChecklistDetails from './components/treasurer/ChecklistDetails';
import ProtectedRoute from './components/ProtectedRoute';
//import TreasurerProfile from './components/treasurer/TreasurerProfile';
import JoinGroupStep from './components/auth/JoinGroupStep';
import React, { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from './utils/api';
import DashboardRouter from './pages/DashboardRouter';
//import StudentDashboardGuard from './pages/dashboard/StudentDashboardGuard';
import SectionStudentDashboardGuard from './pages/dashboard/SectionStudentDashboardGuard';
import VerifyPayments from './components/fc/VerifyPayments';
import Expenses from './components/fc/Expenses';
import LoanManagement from './components/fc/LoanManagement';
import LoanDisbursement from './components/fc/LoanDisbursement';
import PayExpense from './pages/PayExpense';
import TreasurerSettings from './components/treasurer/TreasurerSettings';
import Notifications from './pages/Notifications';

function RequireGroup({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = React.useState(true);
  const [hasGroup, setHasGroup] = React.useState<boolean | null>(null);

  useEffect(() => {
    const checkGroup = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setHasGroup(false);
        setChecking(false);
        return;
      }
      try {
        const response = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setHasGroup(false);
        } else {
          setHasGroup(!!(data.groupId || data.group_id || data.data?.groupId || data.data?.group_id));
        }
      } catch {
        setHasGroup(false);
      } finally {
        setChecking(false);
      }
    };
    checkGroup();
  }, [location.pathname]);

  if (checking) return null;
  if (!hasGroup && location.pathname !== '/join-group') {
    navigate('/join-group');
    return null;
  }
  return children;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute role="student">
                <RequireGroup>
                  <StudentDashboard />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/fc"
            element={
              <ProtectedRoute role="finance_coordinator">
                <RequireGroup>
                  <FCDashboard />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmailInfo />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          
          {/* Protected Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <RequireGroup>
                  <Profile />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/loans/request" element={<LoanRequest />} />
          <Route path="/loans/my-loans" element={<MyLoans />} />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute role="student">
                <RequireGroup>
                  <PaymentHistory />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/group-settings" element={<GroupSettings />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:memberId" element={<MemberDetail />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <RequireGroup>
                  <Admin />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute role="admin">
                <RequireGroup>
                  <Profile />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <TreasurerDashboard />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/profile"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <Profile />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/dues/new"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <CreateDueForm />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/dues"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <DuesList />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/dues/:dueId"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <DueDetails />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/payments/pending"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <PendingPayments />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/export"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <ExportData />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/treasurer/settings" element={<TreasurerSettings />} />
          <Route
            path="/treasurer/checklists"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <ChecklistPage />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treasurer/checklists/:checklistId"
            element={
              <ProtectedRoute role="treasurer">
                <RequireGroup>
                  <ChecklistDetails />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/join-group" element={<JoinGroupStep />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="student">
                <RequireGroup>
                  <DashboardRouter />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/section"
            element={
              <ProtectedRoute role="student">
                <RequireGroup>
                  <SectionStudentDashboardGuard />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-payments"
            element={
              <ProtectedRoute role="finance_coordinator">
                <RequireGroup>
                  <VerifyPayments />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute role="finance_coordinator">
                <RequireGroup>
                  <Expenses />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute role="finance_coordinator">
                <RequireGroup>
                  <LoanManagement />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/disburse/:loanId"
            element={
              <ProtectedRoute role="finance_coordinator">
                <RequireGroup>
                  <LoanDisbursement />
                </RequireGroup>
              </ProtectedRoute>
            }
          />
          <Route path="/pay-expense" element={<ProtectedRoute><PayExpense /></ProtectedRoute>} />
          <Route path="/notifications" element={<Notifications />} />
          {/* Add this as the last route to catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
