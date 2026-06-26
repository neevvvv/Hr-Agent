import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminQueue from './pages/AdminQueue';
import Documents from './pages/Documents';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Memories from './pages/Memories';

function Protected({ children, role }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><AdminQueue /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/documents" element={<Protected><Documents /></Protected>} />
          <Route path="/tickets" element={<Protected><Tickets /></Protected>} />
          <Route path="/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
          <Route path="/memories" element={<Protected><Memories /></Protected>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}