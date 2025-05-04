import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import VerifyEmail from './pages/VerifyEmail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard/student" element={<StudentDashboard />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Add more routes here later */}
      </Routes>
    </Router>
  );
}

export default App;
