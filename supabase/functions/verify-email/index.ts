import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // ✅ Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { email } = await req.json();
    const apiKey = Deno.env.get("KICKBOX_API_KEY");

    if (!email || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing email or API key" }),
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          status: 400,
        },
      );
    }

    // ✅ Call Kickbox API to verify email
    const response = await fetch(`https://api.kickbox.com/v2/verify?email=${email}&apikey=${apiKey}`);
    const data = await response.json();

    // ✅ Return result
    if (data.result === "deliverable") {
      return new Response(
        JSON.stringify({ success: true, message: "Email is valid" }),
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or undeliverable email" }),
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          status: 400,
        },
      );
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
