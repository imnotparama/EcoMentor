import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/layout/AppShell'

import React, { Suspense } from 'react'

// Pages
const Landing = React.lazy(() => import('@/pages/Landing'))
const AuthPage = React.lazy(() => import('@/pages/AuthPage'))
const Onboarding = React.lazy(() => import('@/pages/Onboarding'))
const Assessment = React.lazy(() => import('@/pages/Assessment'))
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const Progress = React.lazy(() => import('@/pages/Progress'))
const Challenges = React.lazy(() => import('@/pages/Challenges'))
const Settings = React.lazy(() => import('@/pages/Settings'))

function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>}>
        {children}
      </Suspense>
    </motion.div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppShell><PageTransitionWrapper>{children}</PageTransitionWrapper></AppShell>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <PublicOnlyRouteWrapper>{children}</PublicOnlyRouteWrapper>
}

function PublicOnlyRouteWrapper({ children }: { children: React.ReactNode }) {
  return <PageTransitionWrapper>{children}</PageTransitionWrapper>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<PageTransitionWrapper><Landing /></PageTransitionWrapper>} />
        <Route path="/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><AuthPage mode="register" /></PublicOnlyRoute>} />

        {/* Protected routes — wrapped in AppShell sidebar layout */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
