import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthorizedRoute } from './components/AuthorizedRoute';
import { Dashboard } from './pages/Dashboard';
import { DataCollection } from './pages/DataCollection';
import { AuthPage } from './pages/AuthPage';
import { UserManagement } from './pages/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/collect" element={<DataCollection />} />
          <Route path="/auth/login" element={<AuthPage mode="login" />} />
          <Route path="/auth/signup" element={<AuthPage mode="signup" />} />
          <Route path="/auth/reset" element={<AuthPage mode="reset" />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AuthorizedRoute>
                  <Dashboard />
                </AuthorizedRoute>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <AuthorizedRoute role="super_admin">
                  <UserManagement />
                </AuthorizedRoute>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
