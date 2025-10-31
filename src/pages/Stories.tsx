import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient"
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Story {
  id: string;
  title_sq: string;
  content_sq: string;
  views: number;
  likes: number;
  category_id: string;
  categories?: { name_sq: string };
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("stories")
      .select(`id, title_sq, content_sq, views, category_id, categories (name_sq)`)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching stories:", error);
      } else {
        setStories(data || []);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  return (
    <section className="container mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
        Historitë e Publikuara
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stories.length === 0 ? (
        <p className="text-center text-muted-foreground">Nuk ka histori të publikuara ende.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="p-6 bg-card hover:bg-accent/10 transition-all duration-300 border border-border rounded-xl shadow-sm hover:shadow-glow"
            >
              <Link to={`/story/${story.id}`}>
                <h2 className="text-xl font-semibold mb-3 text-primary hover:underline">
                  {story.title_sq}
                </h2>
              </Link>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {story.content_sq.slice(0, 150)}...
              </p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{story.categories?.name_sq || "Pa kategori"}</span>
                <span>👁 {story.views || 0}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default Stories;
