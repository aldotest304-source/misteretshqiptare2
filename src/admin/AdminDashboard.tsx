import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient"; // ✅ FIXED PATH
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStories from "./parts/AdminStories";
import AdminCategories from "./parts/AdminCategories";
import AdminTags from "./parts/AdminTags";
import AdminAnalytics from "./parts/AdminAnalytics";
import AdminActivity from "./parts/AdminActivity";
import AdminRequests from "./parts/AdminRequests";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        // Get current user from Supabase
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        // Redirect if no user or error fetching user
        if (userError || !user) {
          navigate("/auth");
          return;
        }

        // Check user's role in the "profiles" table
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        // Redirect if not admin
        if (error || !data) {
          navigate("/auth");
          return;
        }

        setIsAdmin(data.role === "admin");
        if (data.role !== "admin") navigate("/auth");
      } catch (err) {
        console.error("Error verifying admin:", err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-medium">
        Checking admin privileges...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center text-lg font-medium">
        Access Denied — Admins Only
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <Tabs defaultValue="stories">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="requests">Admin Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="pt-4">
          <AdminStories />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <AdminCategories />
        </TabsContent>
        <TabsContent value="tags" className="pt-4">
          <AdminTags />
        </TabsContent>
        <TabsContent value="analytics" className="pt-4">
          <AdminAnalytics />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <AdminActivity />
        </TabsContent>
        <TabsContent value="requests" className="pt-4">
          <AdminRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
