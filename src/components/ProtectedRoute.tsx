import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { checkAdminAccess } from "@/lib/utils"

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function verifyAdmin() {
      const hasAccess = await checkAdminAccess()
      setIsAdmin(hasAccess)
      setLoading(false)
    }
    verifyAdmin()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Checking access...
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/auth" replace />

  return children
}
