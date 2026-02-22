
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CreateGroupPage } from './pages/CreateGroupPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { CreateExpensePage } from './pages/CreateExpensePage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { BalanceDetailPage } from './pages/BalanceDetailPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<LoginPage />} />


          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/create-group" element={<CreateGroupPage />} />
            <Route path="/group/:id" element={<GroupDetailPage />} />
            <Route path="/group/:id/expense" element={<CreateExpensePage />} />
            <Route path="/group/:id/expense/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="/group/:id/balance" element={<BalanceDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
