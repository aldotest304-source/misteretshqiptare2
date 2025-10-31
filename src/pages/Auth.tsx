import { useState } from "react"
import { supabase } from "@/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("Logging in...")

    // Try to log in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage("❌ " + error.message)
      return
    }

    // Allow only the authorized admin email
    if (email !== "aldobixheku4444@gmail.com") {
      setMessage("❌ Access denied — unauthorized account.")
      await supabase.auth.signOut()
      return
    }

    setMessage("✅ Welcome, admin!")
    navigate("/admin/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-3">
          Admin Login
        </h1>

        <p className="text-center text-sm text-gray-400 mb-6">
          🔒 Only authorized admin can access this dashboard.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
          >
            Log In
          </button>
        </form>

        {message && (
          <p className="mt-3 text-center text-gray-300 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}
