import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UsersProvider } from './contexts/UsersContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthorizedRoute } from './components/AuthorizedRoute';
import { AppShell } from './components/AppShell';
import { Records } from './pages/Records';
import { DataCollection } from './pages/DataCollection';
import { AuthPage } from './pages/AuthPage';
import { UserManagement } from './pages/UserManagement';
import { EditRecord } from './pages/EditRecord';
import { NewRecord } from './pages/NewRecord';
import { Account } from './pages/Account';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/collect" element={<DataCollection />} />
          <Route path="/auth/login" element={<AuthPage mode="login" />} />
          <Route path="/auth/signup" element={<AuthPage mode="signup" />} />
          <Route path="/auth/reset" element={<AuthPage mode="reset" />} />

          {/* Signed-in, approved staff, inside the app's top bar */}
          <Route
            element={
              <ProtectedRoute>
                <AuthorizedRoute>
                  <UsersProvider>
                    <AppShell />
                  </UsersProvider>
                </AuthorizedRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Records />} />
            <Route path="records/new" element={<NewRecord />} />
            <Route path="account" element={<Account />} />
            <Route
              path="records/:id/edit"
              element={
                <AuthorizedRoute roles={['admin', 'super_admin']}>
                  <EditRecord />
                </AuthorizedRoute>
              }
            />
            <Route
              path="users"
              element={
                <AuthorizedRoute roles={['super_admin']}>
                  <UserManagement />
                </AuthorizedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
