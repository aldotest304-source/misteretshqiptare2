import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/supabaseClient"; // using your client
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Trash2,
  Ghost,
  Eye,
  Heart,
  BarChart3,
  FileText,
  Users,
  Clock,
} from "lucide-react";

/*
ADMIN DASHBOARD GOALS:
- Only allow this exact email to view dashboard
- Show quick analytics (tot views, tot likes, tot stories, unique visitors)
- Manage stories: approve / reject / delete
- Create new story with ONLY 3 categories
*/

// this is the ONLY account allowed to view dashboard
const MASTER_ADMIN_EMAIL = "aldobixheku19@gmail.com";

const Admin = () => {
  const navigate = useNavigate();

  // session / access
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // data for dashboard
  const [stories, setStories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // analytics
  const [totalViews, setTotalViews] = useState<number>(0);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalStories, setTotalStories] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);

  // new story form
  const [submittingStory, setSubmittingStory] = useState(false);
  const [formData, setFormData] = useState({
    title_sq: "",
    title_en: "",
    content_sq: "",
    content_en: "",
    category_id: "",
    image_url: "",
  });

  // hardcoded categories (ONLY these 3 exist in your portal)
  const FIXED_CATEGORIES = [
    {
      id: "legjenda_urbane",
      name_sq: "Legjenda Urbane",
      name_en: "Urban Legends",
    },
    {
      id: "historite_tuaja",
      name_sq: "Historitë Tuaja",
      name_en: "Your Stories",
    },
    {
      id: "kuriozitete_bota",
      name_sq: "Kuriozitete nga Bota",
      name_en: "Curiosities from the World",
    },
  ];

  // -------------------------
  // STEP 1: Check session + access restriction
  // -------------------------
  useEffect(() => {
    const checkAccess = async () => {
      // get current session from supabase
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const email = session?.user?.email ?? null;
      setCurrentEmail(email || null);

      if (!session) {
        // not logged in -> block
        setAuthorized(false);
        setCheckingAccess(false);
        return;
      }

      // only allow MASTER_ADMIN_EMAIL
      if (email === MASTER_ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }

      setCheckingAccess(false);
    };

    checkAccess();

    // keep listener for auth change
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const email = session?.user?.email ?? null;
        setCurrentEmail(email || null);
        setAuthorized(email === MASTER_ADMIN_EMAIL);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // -------------------------
  // STEP 2: Fetch dashboard data (stories pending, comments pending, analytics)
  // -------------------------
  useEffect(() => {
    if (!authorized) return;
    fetchAllData();
  }, [authorized]);

  const fetchAllData = async () => {
    setLoadingData(true);

    // 1. pending / draft stories
    const { data: storyData } = await supabase
      .from("stories")
      .select(
        `
        *,
        profiles(full_name, email)
      `
      )
      .in("status", ["pending", "draft"])
      .order("created_at", { ascending: false });

    if (storyData) setStories(storyData);

    // 2. pending comments
    const { data: commentData } = await supabase
      .from("comments")
      .select(
        `
        *,
        stories(title_sq),
        profiles(full_name)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (commentData) setComments(commentData);

    // 3. analytics

    // total stories
    const { data: publishedStories, count: publishedCount } = await supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    setTotalStories(publishedCount || 0);

    // total likes across all stories
    const { data: likesAgg } = await supabase
      .from("story_likes")
      .select("story_id");

    setTotalLikes(likesAgg ? likesAgg.length : 0);

    // total views: sum views from stories table (assuming stories.views column)
    const { data: viewsAgg } = await supabase
      .from("stories")
      .select("views");

    if (viewsAgg && viewsAgg.length > 0) {
      const sumViews = viewsAgg.reduce(
        (acc: number, row: any) => acc + (row.views || 0),
        0
      );
      setTotalViews(sumViews);
    } else {
      setTotalViews(0);
    }

    // unique visitors from website_visits table (unique ip_address)
    const { data: visitorsAgg } = await supabase
      .from("website_visits")
      .select("ip_address");

    if (visitorsAgg && visitorsAgg.length > 0) {
      const unique = new Set(
        visitorsAgg
          .map((row: any) => row.ip_address)
          .filter((ip: string | null) => !!ip)
      );
      setUniqueVisitors(unique.size);
    } else {
      setUniqueVisitors(0);
    }

    setLoadingData(false);
  };

  // -------------------------
  // STEP 3: Story actions (Approve / Reject / Delete / Publish new)
  // -------------------------
  const updateStoryStatus = async (storyId: string, status: string) => {
    const updateData: any = { status };
    if (status === "published") {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("stories")
      .update(updateData)
      .eq("id", storyId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert(
        status === "published"
          ? "Story published ✅"
          : status === "rejected"
          ? "Story rejected ❌"
          : "Story updated"
      );
      fetchAllData();
    }
  };

  const deleteStory = async (storyId: string) => {
    const yes = confirm(
      "Are you sure you want to delete this story permanently?"
    );
    if (!yes) return;

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      alert("Story deleted 🗑");
      fetchAllData();
    }
  };

  const submitNewStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorized) return;
    if (!formData.title_sq || !formData.title_en) {
      alert("Please fill titles.");
      return;
    }
    if (!formData.content_sq || !formData.content_en) {
      alert("Please fill content.");
      return;
    }
    if (!formData.category_id) {
      alert("Please select a category.");
      return;
    }

    setSubmittingStory(true);

    // actually insert as published directly
    const { error } = await supabase.from("stories").insert({
      title_sq: formData.title_sq,
      title_en: formData.title_en,
      content_sq: formData.content_sq,
      content_en: formData.content_en,
      category_id: formData.category_id,
      image_url: formData.image_url,
      status: "published",
      published_at: new Date().toISOString(),
    });

    if (error) {
      alert("Error creating story: " + error.message);
    } else {
      alert("Story published ✅");
      setFormData({
        title_sq: "",
        title_en: "",
        content_sq: "",
        content_en: "",
        category_id: "",
        image_url: "",
      });
      fetchAllData();
    }

    setSubmittingStory(false);
  };

  // -------------------------
  // RENDER LOGIC
  // -------------------------

  // still checking who you are
  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white text-lg">
        Checking access...
      </div>
    );
  }

  // not allowed
  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-6 text-center">
        <Card className="p-8 bg-card border-border max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-mystery rounded-lg flex items-center justify-center shadow-glow">
              <Ghost className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-500">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            This dashboard is private.
          </p>

          {currentEmail ? (
            <p className="text-xs text-muted-foreground">
              You are logged in as {currentEmail}, but this email is not
              allowed. Only {MASTER_ADMIN_EMAIL} can access.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You are not logged in.
            </p>
          )}

          <Button
            className="mt-6 w-full bg-gradient-mystery hover:opacity-90"
            onClick={async () => {
              // sign out if someone else logs in
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // allowed: full dashboard view
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 space-y-10">
        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Only visible to {MASTER_ADMIN_EMAIL}
          </p>
        </div>

        {/* ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-card border-border shadow-card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Views
              </span>
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {loadingData ? "..." : totalViews}
            </div>
            <div className="text-xs text-muted-foreground">
              Sum of all story views
            </div>
          </Card>

          <Card className="p-6 bg-card border-border shadow-card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Likes
              </span>
              <Heart className="w-4 h-4 text-accent" />
            </div>
            <div className="text-3xl font-bold">
              {loadingData ? "..." : totalLikes}
            </div>
            <div className="text-xs text-muted-foreground">
              Across all stories
            </div>
          </Card>

          <Card className="p-6 bg-card border-border shadow-card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Published Stories
              </span>
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {loadingData ? "..." : totalStories}
            </div>
            <div className="text-xs text-muted-foreground">
              Live on site
            </div>
          </Card>

          <Card className="p-6 bg-card border-border shadow-card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Unique Visitors
              </span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {loadingData ? "..." : uniqueVisitors}
            </div>
            <div className="text-xs text-muted-foreground">
              Based on website_visits
            </div>
          </Card>
        </div>

        {/* MAIN TABS */}
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-secondary flex flex-wrap gap-2">
            <TabsTrigger value="create">Create Story</TabsTrigger>
            <TabsTrigger value="stories">
              Pending Stories ({stories.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              Pending Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Detailed Analytics
            </TabsTrigger>
          </TabsList>

          {/* CREATE STORY TAB */}
          <TabsContent value="create" className="space-y-4">
            <Card className="p-6 bg-card border-border shadow-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Publish New Story
              </h2>

              <form onSubmit={submitNewStory} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title_sq">Titulli (Shqip) *</Label>
                    <Input
                      id="title_sq"
                      value={formData.title_sq}
                      onChange={(e) =>
                        setFormData({ ...formData, title_sq: e.target.value })
                      }
                      required
                      className="bg-background border-border"
                      placeholder="Titulli i historisë..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title (English) *</Label>
                    <Input
                      id="title_en"
                      value={formData.title_en}
                      onChange={(e) =>
                        setFormData({ ...formData, title_en: e.target.value })
                      }
                      required
                      className="bg-background border-border"
                      placeholder="Story title..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="content_sq">Përmbajtja (Shqip) *</Label>
                    <Textarea
                      id="content_sq"
                      value={formData.content_sq}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content_sq: e.target.value,
                        })
                      }
                      required
                      className="bg-background border-border min-h-[200px]"
                      placeholder="Shkruaj historinë këtu..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_en">Content (English) *</Label>
                    <Textarea
                      id="content_en"
                      value={formData.content_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content_en: e.target.value,
                        })
                      }
                      required
                      className="bg-background border-border min-h-[200px]"
                      placeholder="Write your story here..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategoria / Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Zgjedh kategorinë..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FIXED_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_sq} / {cat.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL e Imazhit / Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image_url: e.target.value,
                        })
                      }
                      className="bg-background border-border"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-mystery hover:opacity-90 transition-opacity"
                  disabled={submittingStory}
                >
                  {submittingStory
                    ? "Duke publikuar..."
                    : "Publiko Historinë / Publish Story"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* PENDING STORIES TAB */}
          <TabsContent value="stories" className="space-y-4">
            {stories.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">
                  Nuk ka histori në pritje / No pending stories
                </p>
              </Card>
            ) : (
              stories.map((story) => (
                <Card
                  key={story.id}
                  className="p-6 bg-card border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{story.title_sq}</h3>
                        <Badge variant="outline">{story.status}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        nga {story.profiles?.full_name} (
                        {story.profiles?.email})
                      </p>

                      <p className="text-muted-foreground line-clamp-3 mb-3">
                        {story.excerpt_sq ||
                          story.content_sq?.substring(0, 200)}
                        ...
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {story.views || 0} views
                        </span>

                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-accent" />
                          {story.like_count || 0} likes
                        </span>

                        {story.read_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {story.read_time_minutes} min read
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStoryStatus(story.id, "published")
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Publiko / Publish
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStoryStatus(story.id, "rejected")
                        }
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuzo / Reject
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Fshi / Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* PENDING COMMENTS TAB */}
          <TabsContent value="comments" className="space-y-4">
            {comments.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">
                  Nuk ka komente në pritje / No pending comments
                </p>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="p-6 bg-card border-border hover:border-primary/50 transition-all"
                >
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Në historinë:{" "}
                      <strong>{comment.stories?.title_sq}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      nga {comment.profiles?.full_name}
                    </p>
                    <p className="text-foreground">{comment.content}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("comments")
                          .update({ status: "approved" })
                          .eq("id", comment.id);
                        if (error) {
                          alert("Error: " + error.message);
                        } else {
                          alert("Comment approved ✅");
                          fetchAllData();
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovo / Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("comments")
                          .update({ status: "rejected" })
                          .eq("id", comment.id);
                        if (error) {
                          alert("Error: " + error.message);
                        } else {
                          alert("Comment rejected ❌");
                          fetchAllData();
                        }
                      }}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Refuzo / Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="p-6 bg-card border-border shadow-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Site Analytics Snapshot
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total views (all stories)</span>
                    <span className="text-foreground font-semibold">
                      {totalViews}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total likes (all stories)</span>
                    <span className="text-foreground font-semibold">
                      {totalLikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique visitors (IP-based)</span>
                    <span className="text-foreground font-semibold">
                      {uniqueVisitors}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Published stories</span>
                    <span className="text-foreground font-semibold">
                      {totalStories}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending stories</span>
                    <span className="text-foreground font-semibold">
                      {stories.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending comments</span>
                    <span className="text-foreground font-semibold">
                      {comments.length}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Note: This dashboard calculates stats live from Supabase tables
                (stories, story_likes, website_visits…). No cron jobs, no paid
                monitoring service.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SIGN OUT */}
        <div className="pt-6">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:bg-secondary/50"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
