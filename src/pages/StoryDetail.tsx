import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Eye, Clock, Calendar, User as UserIcon, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [story, setStory] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStory();
      fetchComments();
      incrementViews();
      if (user) {
        checkIfLiked();
      }
    }
  }, [id, user]);

  const fetchStory = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        categories(name_sq, name_en),
        profiles(full_name, avatar_url)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "Gabim / Error",
        description: "Historia nuk u gjet / Story not found",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setStory(data);
    fetchLikeCount();
    setLoading(false);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("story_likes")
      .select("*", { count: "exact", head: true })
      .eq("story_id", id);
    
    setLikeCount(count || 0);
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", id)
      .eq("user_id", user?.id)
      .maybeSingle();
    
    setHasLiked(!!data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq("story_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (data) setComments(data);
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_story_views", { story_uuid: id });
  };

  const toggleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (hasLiked) {
      await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", id)
        .eq("user_id", user.id);
      setHasLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase
        .from("story_likes")
        .insert({ story_id: id, user_id: user.id });
      setHasLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Gabim / Error",
        description: "Komenti nuk mund të jetë bosh / Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSubmittingComment(true);

    const { error } = await supabase.from("comments").insert({
      story_id: id,
      user_id: user.id,
      content: newComment,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Gabim / Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Komenti u dërgua! / Comment submitted!",
        description: "Komenti juaj është duke u rishikuar / Your comment is being reviewed",
      });
      setNewComment("");
    }

    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Duke u ngarkuar... / Loading...</p>
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kthehu / Go Back
        </Button>

        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/90">
              {story.categories?.name_sq}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {story.title_sq}
            </h1>
            <p className="text-xl text-muted-foreground/70 italic mb-6">
              {story.title_en}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {story.profiles?.full_name || "Anonymous"}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(story.published_at || story.created_at), {
                  addSuffix: true,
                })}
              </span>
              {story.read_time_minutes && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {story.read_time_minutes} min lexim
                  </span>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLike}
                className={hasLiked ? "border-accent text-accent" : ""}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`}
                />
                {likeCount}
              </Button>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                {story.views?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {story.image_url && (
            <div className="mb-12 rounded-xl overflow-hidden">
              <img
                src={story.image_url}
                alt={story.title_sq}
                className="w-full h-auto max-h-[600px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-12">
            <div className="text-lg leading-relaxed whitespace-pre-wrap">
              {story.content_sq}
            </div>
            
            <Separator className="my-8" />
            
            <div className="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground/80">
              <p className="text-sm font-semibold mb-4">English Version:</p>
              {story.content_en}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              Komente / Comments ({comments.length})
            </h2>

            {/* Comment Form */}
            {user ? (
              <Card className="p-6 mb-8 bg-card border-border">
                <form onSubmit={submitComment}>
                  <Textarea
                    placeholder="Shto një koment... / Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-4 bg-secondary resize-y"
                    rows={4}
                  />
                  <Button
                    type="submit"
                    disabled={submittingComment}
                    className="bg-gradient-mystery"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingComment ? "Duke dërguar..." : "Dërgo / Submit"}
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-6 mb-8 bg-secondary/50 border-border text-center">
                <p className="text-muted-foreground mb-4">
                  Kyçu për të komentuar / Log in to comment
                </p>
                <Link to="/auth">
                  <Button variant="outline" className="border-primary text-primary">
                    Kyçu / Log In
                  </Button>
                </Link>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nuk ka komente akoma / No comments yet
                </p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} className="p-6 bg-card border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-mystery flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {comment.profiles?.full_name?.[0] || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {comment.profiles?.full_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default StoryDetail;