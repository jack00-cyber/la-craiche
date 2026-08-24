import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import ChildrenPage from './pages/ChildrenPage'
import CarnetsPage from './pages/CarnetsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ParentsPage from './pages/ParentsPage'
import PaymentsPage from './pages/PaymentsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/children" element={<ChildrenPage />} />
              <Route path="/parents" element={<ParentsPage />} />
              <Route path="/carnets" element={<CarnetsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
