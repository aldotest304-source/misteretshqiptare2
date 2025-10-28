// src/pages/Auth.tsx
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://lxbpjglvomfohgrehqdt.supabase.co/functions/v1/verify-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      setIsValid(data.success);
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Admin Signup</h1>
      <input
        type="email"
        className="p-2 text-black rounded w-72 mb-4"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleVerify}
        disabled={loading}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Verifying..." : "Verify Email"}
      </button>

      {isValid === true && <p className="text-green-400 mt-4">✅ Valid email</p>}
      {isValid === false && (
        <p className="text-red-400 mt-4">❌ Invalid or fake email</p>
      )}
    </div>
  );
}
