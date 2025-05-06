import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import FCDashboard from './pages/dashboard/FCDashboard';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailInfo from './pages/VerifyEmailInfo';
import Payment from './pages/Payment';
import LoanRequest from './pages/LoanRequest';
import MyLoans from './pages/MyLoans';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import GroupSettings from './pages/GroupSettings';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Admin from './pages/Admin';
import { ToastProvider } from './context/ToastContext';
import './App.css';
import TreasurerDashboard from './components/treasurer/TreasurerDashboard';
import CreateDueForm from './components/treasurer/CreateDueForm';
import DuesList from './components/treasurer/DuesList';
import DueDetails from './components/treasurer/DueDetails';
import PendingPayments from './components/treasurer/PendingPayments';
import ExportData from './components/treasurer/ExportData';
import ProtectedRoute from './components/ProtectedRoute';
//import TreasurerProfile from './components/treasurer/TreasurerProfile';
import JoinGroupStep from './pages/JoinGroupStep';
import React, { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from './utils/api';
import DashboardRouter from './pages/DashboardRouter';
//import StudentDashboardGuard from './pages/dashboard/StudentDashboardGuard';
import SectionStudentDashboardGuard from './pages/dashboard/SectionStudentDashboardGuard';

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
          <Route path="/payment" element={<Payment />} />
          
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
          {/* Add more routes here later */}
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
