// supabase/functions/verify-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { email } = await req.json();
    const apiKey = Deno.env.get("KICKBOX_API_KEY");

    if (!email || !apiKey) {
      return new Response(JSON.stringify({ success: false, message: "Missing email or API key" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const response = await fetch(`https://api.kickbox.com/v2/verify?email=${email}&apikey=${apiKey}`);
    const data = await response.json();

    if (data.result === "deliverable") {
      return new Response(JSON.stringify({ success: true, message: "Email is valid" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: "Invalid or undeliverable email" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
