import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Navbar, Footer } from './components/Layout'
import { Toaster } from './components/Toaster'
import { useStore } from './lib/store'
import HomePage from './pages/HomePage'
import SalonsPage from './pages/SalonsPage'
import SalonDetailPage from './pages/SalonDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CrmPage from './pages/CrmPage'
import PricingPage from './pages/PricingPage'
import FaqPage from './pages/FaqPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import NotFoundPage from './pages/NotFoundPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen bg-forest text-cream font-body">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/salons" element={<SalonsPage />} />
          <Route path="/salon/:slug" element={<SalonDetailPage />} />
          <Route path="/booking/:slug" element={<BookingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/crm"
            element={
              <RequireAuth>
                <CrmPage />
              </RequireAuth>
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
