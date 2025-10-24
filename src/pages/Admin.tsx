import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Eye, EyeOff, Trash2, Ghost, PlusCircle } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    title_sq: "",
    title_en: "",
    content_sq: "",
    content_en: "",
    category_id: "",
    image_url: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoginLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
      toast({
        title: "Aksesi refuzuar / Access denied",
        description: "Nuk keni leje për të aksesuar këtë faqe / You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingStories();
      fetchPendingComments();
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name_sq");
    
    if (data) setCategories(data);
  };

  const fetchPendingStories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stories")
      .select(`
        *,
        categories(name_sq, name_en),
        profiles(full_name, email)
      `)
      .in("status", ["pending", "draft"])
      .order("created_at", { ascending: false });
    
    if (data) setStories(data);
    setLoading(false);
  };

  const fetchPendingComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        stories(title_sq),
        profiles(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (data) setComments(data);
  };

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
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukses / Success",
        description: status === "published" ? "Historia u publikua / Story published" : "Historia u refuzua / Story rejected",
      });
      fetchPendingStories();
    }
  };

  const updateCommentStatus = async (commentId: string, status: string) => {
    const { error } = await supabase
      .from("comments")
      .update({ status })
      .eq("id", commentId);

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukses / Success",
        description: status === "approved" ? "Komenti u aprovua / Comment approved" : "Komenti u refuzua / Comment rejected",
      });
      fetchPendingComments();
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm("Je i sigurt që dëshiron ta fshish këtë histori? / Are you sure you want to delete this story?")) {
      return;
    }

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId);

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukses / Success",
        description: "Historia u fshi / Story deleted",
      });
      fetchPendingStories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    const { error } = await supabase.from("stories").insert({
      ...formData,
      author_id: user?.id,
      status: "published",
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukses / Success",
        description: "Historia u publikua / Story published successfully",
      });
      setFormData({
        title_sq: "",
        title_en: "",
        content_sq: "",
        content_en: "",
        category_id: "",
        image_url: "",
      });
      fetchPendingStories();
    }
    setSubmitLoading(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-mystery rounded-lg flex items-center justify-center shadow-glow">
                <Ghost className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-muted-foreground">
              Kyçu për të menaxhuar përmbajtjen / Login to manage content
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-border pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-mystery hover:opacity-90 transition-opacity"
              disabled={loginLoading}
            >
              {loginLoading ? "Duke u kyçur..." : "Kyçu / Login"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Admin Panel
            </span>
          </h1>
          <p className="text-muted-foreground">
            Menaxho historitë dhe komentet / Manage stories and comments
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Krijo Histori / Create Story
            </TabsTrigger>
            <TabsTrigger value="stories">
              Histori në pritje ({stories.length})
            </TabsTrigger>
            <TabsTrigger value="comments">
              Komente në pritje ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Card className="p-6 bg-card border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title_sq">Titulli (Shqip) *</Label>
                    <Input
                      id="title_sq"
                      value={formData.title_sq}
                      onChange={(e) => setFormData({ ...formData, title_sq: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, content_sq: e.target.value })}
                      required
                      className="bg-background border-border min-h-[300px]"
                      placeholder="Shkruaj historinë këtu..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_en">Content (English) *</Label>
                    <Textarea
                      id="content_en"
                      value={formData.content_en}
                      onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                      required
                      className="bg-background border-border min-h-[300px]"
                      placeholder="Write your story here..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategoria / Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Zgjedh kategorinë..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name_sq} / {category.name_en}
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
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="bg-background border-border"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-mystery hover:opacity-90 transition-opacity"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Duke publikuar..." : "Publiko Historinë / Publish Story"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            {stories.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">
                  Nuk ka histori në pritje / No pending stories
                </p>
              </Card>
            ) : (
              stories.map((story) => (
                <Card key={story.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{story.title_sq}</h3>
                        <Badge variant="outline">{story.categories?.name_sq}</Badge>
                        <Badge variant={story.status === "pending" ? "default" : "secondary"}>
                          {story.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        nga {story.profiles?.full_name} ({story.profiles?.email})
                      </p>
                      <p className="text-muted-foreground line-clamp-3 mb-3">
                        {story.excerpt_sq || story.content_sq.substring(0, 200)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStoryStatus(story.id, "published")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Publiko / Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStoryStatus(story.id, "rejected")}
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
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {comments.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <p className="text-muted-foreground">
                  Nuk ka komente në pritje / No pending comments
                </p>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Në historinë: <strong>{comment.stories?.title_sq}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      nga {comment.profiles?.full_name}
                    </p>
                    <p className="text-foreground">{comment.content}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateCommentStatus(comment.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovo / Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCommentStatus(comment.id, "rejected")}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
