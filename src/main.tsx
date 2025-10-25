import { supabase } from '../supabase/supabaseClient'
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import React, { useEffect } from "react";

function AppWithLogger() {
  useEffect(() => {
    async function logVisit() {
      try {
        // Get user IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        // Collect visitor info
        const userAgent = navigator.userAgent;
        const pageUrl = window.location.href;

        // Save to Supabase
        const { error } = await supabase.from('website_visits').insert([
          {
            ip_address: ip,
            user_agent: userAgent,
            page_url: pageUrl,
          },
        ]);

        if (error) console.error('Supabase insert error:', error);
        else console.log('Visit logged successfully');
      } catch (error) {
        console.error('Failed to log visit:', error);
      }
    }

    logVisit();
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(<AppWithLogger />);
