import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { CallbackPage } from '@/features/auth/CallbackPage'
import { ForbiddenPage } from '@/features/auth/ForbiddenPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmployeeLayout } from '@/components/layout/EmployeeLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AssetsPage } from '@/features/assets/AssetsPage'
import { RepairPage } from '@/features/repair/RepairPage'
import { UsersPage } from '@/features/users/UsersPage'
import { SummaryPage } from '@/features/summary/SummaryPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { QueryListEmployee } from '@/features/queries/QueryListEmployee'
import { NewQueryPage } from '@/features/queries/NewQueryPage'
import { QueryDetailEmployee } from '@/features/queries/QueryDetailEmployee'
import { EditQueryPage } from '@/features/queries/EditQueryPage'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { RoleRedirect } from '@/features/auth/RoleRedirect'

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#202427',
              border: '1px solid #DEE2E6',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 16px rgba(25,82,116,0.12)',
            },
          }}
        />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<CallbackPage />} />
              <Route path="/403" element={<ForbiddenPage />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route
                    path="/repair"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <RepairPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/summary"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <SummaryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Route>

              {/* Employee routes */}
              <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                <Route element={<EmployeeLayout />}>
                  <Route path="/employee/queries" element={<QueryListEmployee />} />
                  <Route path="/employee/queries/new" element={<NewQueryPage />} />
                  <Route path="/employee/queries/:id" element={<QueryDetailEmployee />} />
                  <Route path="/employee/queries/:id/edit" element={<EditQueryPage />} />
                </Route>
              </Route>

              {/* Root redirect — route based on role */}
              <Route index element={<RoleRedirect />} />
              <Route path="*" element={<RoleRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
