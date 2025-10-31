import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Check,
  X,
  Trash2,
  LineChart,
  Eye,
  Heart,
  MessageSquare,
  BookOpen,
  PlusCircle,
  Globe,
  Clock,
} from "lucide-react"
import StatsHeader from "./StatsHeader"

// This dashboard is ONLY for approved admins
// Assumes route is already protected by ProtectedRoute in App.tsx

type Story = {
  id: string
  title_sq: string
  title_en: string
  content_sq: string
  content_en: string
  status: string
  created_at: string
  published_at: string | null
  category_id: string
  image_url: string | null
  views?: number
  like_count?: number
  read_time_minutes?: number
  categories?: {
    name_sq: string
    name_en: string
  }
  profiles?: {
    full_name: string
    email: string
  }
}

type Comment = {
  id: string
  content: string
  status: string
  created_at: string
  stories?: {
    title_sq: string
  }
  profiles?: {
    full_name: string
  }
}

type Category = {
  id: string
  name_sq: string
  name_en: string
}

// We'll maintain dashboard-scoped state and actions here
export default function AdminDashboard() {
  const { toast } = useToast()

  // Dashboard data
  const [stories, setStories] = useState<Story[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  // Analytics top-row stats
  const [totalViews, setTotalViews] = useState<number>(0)
  const [totalLikes, setTotalLikes] = useState<number>(0)
  const [totalComments, setTotalComments] = useState<number>(0)
  const [totalStories, setTotalStories] = useState<number>(0)

  // Categories are LOCKED to only your 3 official ones.
  // We will fetch categories from Supabase but we will FILTER them.
  const [categories, setCategories] = useState<Category[]>([])

  // Create-story form state
  const [submittingStory, setSubmittingStory] = useState(false)
  const [formData, setFormData] = useState({
    title_sq: "",
    title_en: "",
    content_sq: "",
    content_en: "",
    category_id: "",
    image_url: "",
  })

  // On mount: load dashboard data
  useEffect(() => {
    initDashboard()
  }, [])

  async function initDashboard() {
    setLoading(true)

    await Promise.all([
      fetchCategoriesLimited(),
      fetchStories(),
      fetchCommentsPending(),
      fetchDashboardStats(),
    ])

    setLoading(false)
  }

  // 1. Categories: only allow your 3 official ones
  async function fetchCategoriesLimited() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_sq, name_en")

    if (error) {
      console.error("fetchCategoriesLimited error:", error)
      return
    }

    if (!data) return

    // ✅ We enforce ONLY these 3 by name_sq.
    const allowed = [
      "Legjenda Urbane",
      "Historitë Tuaja",
      "Kuriozitete nga Bota",
    ]

    const filtered = data.filter((cat) => allowed.includes(cat.name_sq))
    setCategories(filtered)
  }

  // 2. Stories: get all stories (any status) newest first
  async function fetchStories() {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        categories(name_sq, name_en),
        profiles(full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("fetchStories error:", error)
      return
    }

    setStories((data as Story[]) || [])
    setTotalStories(data?.length || 0)
  }

  // 3. Comments: only pending (needs review)
  async function fetchCommentsPending() {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        stories(title_sq),
        profiles(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("fetchCommentsPending error:", error)
      return
    }

    setComments((data as Comment[]) || [])
  }

  // 4. Analytics stats:
  // We'll gather high level metrics from your tables.
  // Assumes:
  // - stories table has views, like_count
  // - comments table is all comments
  // - story_likes table can be counted if you use it
  // - website_visits table is tracked in main.tsx
  async function fetchDashboardStats() {
    // Total views + likes from stories
    const { data: storyAgg, error: storyAggErr } = await supabase
      .from("stories")
      .select("views, like_count")

    if (!storyAggErr && storyAgg) {
      const viewsSum = storyAgg.reduce((acc: number, row: any) => {
        return acc + (row.views || 0)
      }, 0)
      const likesSum = storyAgg.reduce((acc: number, row: any) => {
        return acc + (row.like_count || 0)
      }, 0)
      setTotalViews(viewsSum)
      setTotalLikes(likesSum)
    }

    // Total approved comments
    const { count: approvedCommentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")

    setTotalComments(approvedCommentsCount || 0)
  }

  // Approve / Reject / Delete story
  async function updateStoryStatus(storyId: string, status: string) {
    const updateData: any = { status }
    if (status === "published") {
      updateData.published_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("stories")
      .update(updateData)
      .eq("id", storyId)

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sukses / Success",
        description:
          status === "published"
            ? "Historia u publikua / Story published"
            : status === "rejected"
            ? "Historia u refuzua / Story rejected"
            : "Historia u përditësua",
      })
      fetchStories()
    }
  }

  async function deleteStory(storyId: string) {
    const sure = confirm(
      "Je i sigurt që dëshiron ta fshish këtë histori? / Are you sure you want to delete this story?"
    )
    if (!sure) return

    const { error } = await supabase.from("stories").delete().eq("id", storyId)

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sukses / Success",
        description: "Historia u fshi / Story deleted",
      })
      fetchStories()
    }
  }

  // Approve / Reject comment
  async function updateCommentStatus(commentId: string, status: string) {
    const { error } = await supabase
      .from("comments")
      .update({ status })
      .eq("id", commentId)

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sukses / Success",
        description:
          status === "approved"
            ? "Komenti u aprovua / Comment approved"
            : "Komenti u refuzua / Comment rejected",
      })
      fetchCommentsPending()
    }
  }

  // Handle new story creation
  async function handleSubmitNewStory(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingStory(true)

    // get current user (author)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("stories").insert([
      {
        title_sq: formData.title_sq,
        title_en: formData.title_en,
        content_sq: formData.content_sq,
        content_en: formData.content_en,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        author_id: user?.id || null, // you may call this author_id or user_id in DB
        status: "published", // directly live, you can change to "pending" if you want review
        published_at: new Date().toISOString(),
      },
    ])

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Historia u publikua / Story published",
        description: "Story is now live.",
      })
      setFormData({
        title_sq: "",
        title_en: "",
        content_sq: "",
        content_en: "",
        category_id: "",
        image_url: "",
      })
      fetchStories()
    }

    setSubmittingStory(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-lg">
        Duke u ngarkuar paneli... / Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Top Stats overview */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-10">
          <StatsHeader
            totalViews={totalViews}
            totalLikes={totalLikes}
            totalComments={totalComments}
            totalStories={totalStories}
          />
        </div>
      </div>

      {/* Tabs: Overview / Stories / Create / Comments */}
      <div className="container mx-auto px-4 py-10">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-secondary/40 flex flex-wrap gap-2 p-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Stories ({stories.length})
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Story
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length} pending)
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-card border-border p-6 shadow-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Site Performance
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ky seksion përmbledh performancën e faqes. Në versionin e
                ardhshëm mund të shtojmë grafiqe ditore/ javore nga tabela
                <code className="px-1 text-primary"> website_visits </code>,
                “top stories” sipas shikimeve, dhe trendet e komenteve.
              </p>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Total Views:
                    </span>
                    <span>{totalViews.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">
                      Total Likes:
                    </span>
                    <span>{totalLikes.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Approved Comments:
                    </span>
                    <span>{totalComments.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Stories Published:
                    </span>
                    <span>{totalStories.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Categories in Use:
                    </span>
                    <span>{categories.length} / 3 fixed</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      Real-time feed:
                    </span>
                    <span className="text-muted-foreground">
                      (Next step: Supabase Realtime)
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* STORIES TAB */}
          <TabsContent value="stories" className="space-y-6">
            {stories.length === 0 ? (
              <Card className="p-8 bg-card border-border text-center text-muted-foreground">
                Nuk ka histori ende.
              </Card>
            ) : (
              stories.map((story) => (
                <Card
                  key={story.id}
                  className="bg-card border-border p-6 shadow-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {story.title_sq}
                        </h3>

                        <Badge variant="outline" className="text-xs">
                          {story.categories?.name_sq || "—"}
                        </Badge>

                        <Badge
                          variant={
                            story.status === "published"
                              ? "default"
                              : story.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] uppercase tracking-wide"
                        >
                          {story.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {story.profiles?.full_name
                          ? `${story.profiles?.full_name} (${story.profiles?.email})`
                          : "Anonymous"}
                      </p>

                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {story.content_sq?.substring(0, 200)}...
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{story.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-accent" />
                          <span>{story.like_count || 0} likes</span>
                        </div>
                        {story.read_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{story.read_time_minutes} min read</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStoryStatus(story.id, "published")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Publiko
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => updateStoryStatus(story.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuzo
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Fshi
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* CREATE NEW STORY TAB */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-card border-border p-6 shadow-card">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Krijo / Publiko Histori të Re
              </h2>

              <form onSubmit={handleSubmitNewStory} className="space-y-6">
                {/* Title row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title_sq">Titulli (Shqip) *</Label>
                    <Input
                      id="title_sq"
                      required
                      value={formData.title_sq}
                      onChange={(e) =>
                        setFormData({ ...formData, title_sq: e.target.value })
                      }
                      className="bg-background border-border"
                      placeholder="Titulli i historisë..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title (English) *</Label>
                    <Input
                      id="title_en"
                      required
                      value={formData.title_en}
                      onChange={(e) =>
                        setFormData({ ...formData, title_en: e.target.value })
                      }
                      className="bg-background border-border"
                      placeholder="Story title..."
                    />
                  </div>
                </div>

                {/* Content row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="content_sq">Përmbajtja (Shqip) *</Label>
                    <Textarea
                      id="content_sq"
                      required
                      value={formData.content_sq}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content_sq: e.target.value,
                        })
                      }
                      className="bg-background border-border min-h-[220px]"
                      placeholder="Shkruaj historinë këtu..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_en">Content (English) *</Label>
                    <Textarea
                      id="content_en"
                      required
                      value={formData.content_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content_en: e.target.value,
                        })
                      }
                      className="bg-background border-border min-h-[220px]"
                      placeholder="Write your story here..."
                    />
                  </div>
                </div>

                {/* Category / Image row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Kategoria / Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(val) =>
                        setFormData({ ...formData, category_id: val })
                      }
                      required
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Zgjedh kategorinë..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_sq} / {cat.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Vetëm 3 kategoritë ekzistuese lejohen. Nuk mund të shtohen
                      kategori të reja.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL e Imazhit / Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="bg-background border-border"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      (Hapi tjetër profesional: ngarkim direkt në Supabase
                      Storage.)
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submittingStory}
                  className="w-full bg-gradient-mystery hover:opacity-90 transition-opacity"
                >
                  {submittingStory
                    ? "Duke publikuar..."
                    : "Publiko Historinë / Publish Story"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments" className="space-y-6">
            {comments.length === 0 ? (
              <Card className="p-8 bg-card border-border text-center text-muted-foreground">
                Nuk ka komente në pritje / No pending comments
              </Card>
            ) : (
              comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="bg-card border-border p-6 shadow-card hover:border-primary/50 transition-colors"
                >
                  <div className="mb-3 text-sm text-muted-foreground">
                    Në historinë:{" "}
                    <span className="text-foreground font-semibold">
                      {comment.stories?.title_sq}
                    </span>
                  </div>

                  <div className="mb-2 text-foreground text-base whitespace-pre-wrap">
                    {comment.content}
                  </div>

                  <div className="text-xs text-muted-foreground mb-4">
                    nga {comment.profiles?.full_name || "Anonim"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        updateCommentStatus(comment.id, "approved")
                      }
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovo / Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        updateCommentStatus(comment.id, "rejected")
                      }
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
  )
}
