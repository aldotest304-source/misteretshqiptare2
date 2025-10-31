import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"

// ✅ Pages
import Index from "./pages/Index"
import StoryDetail from "./pages/StoryDetail"
import NotFound from "./pages/NotFound"
import CategoryPage from "./pages/CategoryPage"
import AuthPage from "./pages/Auth"
import AdminDashboard from "./admin/AdminDashboard"

// ⚙️ React Query client
const queryClient = new QueryClient()

// 🔒 Protected Route Wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Loading...
      </div>
    )
  }

  // Deny access if no session or wrong email
  if (!session || session.user?.email !== "aldobixheku4444@gmail.com") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Access Denied — Admins Only
      </div>
    )
  }

  return children
}

// 🌐 Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🌍 Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/story/:id" element={<StoryDetail />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* 🔐 Protected Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ✅ Redirect plain /admin to dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* ❌ 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
