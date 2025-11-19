import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, SyncProvider, useAuth } from '@/contexts';
import { ProtectedRoute } from '@/components/routing';
import { MainLayout } from '@/components/layout';
import './App.css';
// Import i18n to initialize internationalization
import './i18n';

// Lazy loaded components
const Landing = React.lazy(() => import('@/pages/Landing'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Login = React.lazy(() => import('@/pages/Login'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Products = React.lazy(() => import('@/pages/Products/Products'));
const ProductForm = React.lazy(() => import('@/pages/Products/ProductForm'));
const Inventory = React.lazy(() => import('@/pages/Inventory/Inventory'));
const StockMovements = React.lazy(() => import('@/pages/Inventory/StockMovements'));
const Customers = React.lazy(() => import('@/pages/Customers/Customers'));
const CustomerForm = React.lazy(() => import('@/pages/Customers/CustomerForm'));
const Suppliers = React.lazy(() => import('@/pages/Suppliers/Suppliers'));
const SupplierForm = React.lazy(() => import('@/pages/Suppliers/SupplierForm'));
const Branches = React.lazy(() => import('@/pages/Branches/Branches'));
const BranchForm = React.lazy(() => import('@/pages/Branches/BranchForm'));
const Warehouses = React.lazy(() => import('@/pages/Warehouses/Warehouses'));
const WarehouseForm = React.lazy(() => import('@/pages/Warehouses/WarehouseForm'));
const SalesReport = React.lazy(() => import('@/pages/Reports/SalesReport'));
const Settings = React.lazy(() => import('@/pages/Settings/Settings'));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Create Material-UI Theme
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Green color for Zaytuna
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f57c00', // Orange
      light: '#ffad42',
      dark: '#bb4d00',
      contrastText: '#000000',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000000',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Cairo", "CairoLocal", "CairoFallback", "Segoe UI", "Tahoma", "Arial Unicode MS", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          minHeight: 40,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: 'none',
          borderRight: 'none',
        },
      },
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

// Sync Provider Wrapper - يحتاج إلى معرف المستخدم من Auth
const SyncProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // إنشاء معرف جهاز فريد
  const deviceId = React.useMemo(() => {
    const stored = localStorage.getItem('zaytuna_device_id');
    if (stored) return stored;

    const newId = crypto.randomUUID();
    localStorage.setItem('zaytuna_device_id', newId);
    return newId;
  }, []);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SyncProvider deviceId={deviceId} userId={user.id}>
      {children}
    </SyncProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <SyncProviderWrapper>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                {/* Public Landing Page */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requiresAuth={false}>
                      <Landing />
                    </ProtectedRoute>
                  }
                />

                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <ProtectedRoute requiresAuth={false}>
                      <Login />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes with Layout */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Products Routes */}
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Products />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProductForm mode="create" />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProductForm mode="edit" />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Inventory Routes */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Inventory />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/movements"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <StockMovements />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Customers Routes */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Customers />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CustomerForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CustomerForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Suppliers Routes */}
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Suppliers />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SupplierForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SupplierForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Branches Routes */}
                <Route
                  path="/branches"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Branches />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/branches/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <BranchForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/branches/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <BranchForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Warehouses Routes */}
                <Route
                  path="/warehouses"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Warehouses />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/warehouses/new"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WarehouseForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/warehouses/:id/edit"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <WarehouseForm />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Reports Routes */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <SalesReport />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Settings Routes */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SyncProviderWrapper>
          </AuthProvider>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              direction: 'rtl',
            },
          }}
        />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
