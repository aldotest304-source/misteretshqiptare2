import { useState } from "react"
import { supabase } from "@/supabaseClient"

export default function AdminSignup() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      // ✅ Step 1: Verify with Kickbox API (check if mailbox really exists)
      const res = await fetch(
        `https://api.kickbox.com/v2/verify?email=${email}&apikey=live_43a914ca89a6c0325e0e3ff24774305314350f3bdfe3171f45d4999270c8275d`
      )
      const data = await res.json()

      if (!data || data.result !== "deliverable") {
        setMessage("❌ Email address does not exist or cannot receive mail.")
        setLoading(false)
        return
      }

      // ✅ Step 2: Try inserting into admin_requests
      const { error } = await supabase.from("admin_requests").insert([
        {
          email,
          status: "pending",
          requested_at: new Date().toISOString(),
        },
      ])

      // ✅ Handle duplicate (unique index)
      if (error && error.code === "23505") {
        setMessage(
          "⚠️ This email has already made a request. You can’t request again."
        )
        setLoading(false)
        return
      }

      if (error) {
        console.error("Supabase insert error:", error)
        setMessage("⚠️ " + error.message)
      } else {
        setMessage("✅ Request sent successfully! Wait for admin approval.")
      }
    } catch (err: any) {
      console.error(err)
      setMessage("❌ Something went wrong: " + err.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Request Admin Access
        </h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="px-4 py-2 rounded bg-gray-700 border border-gray-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 font-semibold disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Submit"}
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  )
}
