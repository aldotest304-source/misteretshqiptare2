import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"

interface AdminRequest {
  id: string
  email: string
  status: string
  requested_at: string
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("admin_requests")
      .select("*")
      .order("requested_at", { ascending: false })
    if (error) console.error(error)
    else setRequests(data || [])
    setLoading(false)
  }

  const handleAction = async (
    id: string,
    email: string,
    action: "approve" | "reject"
  ) => {
    setMessage("")

    if (action === "approve") {
      // 1️⃣ Add to admins table
      const { error: addError } = await supabase
        .from("admins")
        .insert([{ email }])

      if (addError && addError.code !== "23505") {
        console.error(addError)
        setMessage("Error adding admin: " + addError.message)
        return
      }

      // 2️⃣ Update admin_requests
      await supabase
        .from("admin_requests")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
        })
        .eq("id", id)
    } else {
      // ❌ Reject request
      await supabase
        .from("admin_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", id)
    }

    setMessage(
      action === "approve"
        ? `✅ Approved and added ${email} as admin.`
        : `❌ Rejected ${email}.`
    )

    await fetchRequests()
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Requests</h1>
      {message && (
        <div className="mb-4 bg-gray-700 p-3 rounded-md text-sm">{message}</div>
      )}
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className="w-full text-sm border border-gray-700 rounded">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-3 text-left">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Requested At</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-gray-700">
                <td className="p-3">{r.email}</td>
                <td className="p-3 text-center capitalize">{r.status}</td>
                <td className="p-3 text-center">
                  {new Date(r.requested_at).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {r.status === "pending" ? (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleAction(r.id, r.email, "approve")}
                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(r.id, r.email, "reject")}
                        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">{r.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
