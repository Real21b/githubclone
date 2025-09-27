import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Box, CircularProgress } from '@mui/material'

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Repository = lazy(() => import('./pages/Repository'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Layout components
const Layout = lazy(() => import('./components/Layout/Layout'))
const AuthLayout = lazy(() => import('./components/Layout/AuthLayout'))

// Unified Index component for microservices integration
const UnifiedIndex = lazy(() => import('./components/UnifiedIndex'))

// Loading component
const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
)

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Unified Index - Microservices Integration */}
        <Route path="/" element={<UnifiedIndex />} />
        <Route path="/index" element={<UnifiedIndex />} />
        <Route path="/status" element={<UnifiedIndex />} />
        <Route path="/health" element={<UnifiedIndex />} />
        
        {/* Public routes */}
        <Route path="/home" element={<Home />} />
        
        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        
        {/* Protected routes */}
        <Route path="/app" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="repository/:id" element={<Repository />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
