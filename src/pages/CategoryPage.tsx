import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchCategoryAndStories(slug);
  }, [slug]);

  const fetchCategoryAndStories = async (slug: string) => {
    setLoading(true);
    // Merr kategorinë sipas slug
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (catData) {
      setCategory(catData);

      // Merr historitë e lidhura me kategorinë
      const { data: storyData } = await supabase
        .from("stories")
        .select("*")
        .eq("category_id", catData.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      setStories(storyData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Duke u ngarkuar... / Loading...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Kategoria nuk u gjet / Category not found
      </div>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{category.name_sq}</h1>
          <p className="text-muted-foreground text-lg">{category.description_sq}</p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Nuk ka histori për këtë kategori
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Link key={story.id} to={`/story/${story.id}`}>
                <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-mystery cursor-pointer">
                  {story.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={story.image_url}
                        alt={story.title_sq}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm">
                        {category.name_sq}
                      </Badge>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {story.title_sq}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {story.excerpt_sq || story.content_sq?.substring(0, 150)}...
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {story.views || 0}
                      </span>
                      <span className="flex items-center gap-1 text-accent">
                        <Heart className="h-4 w-4" />
                        {story.like_count || 0}
                      </span>
                      {story.read_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {story.read_time_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryPage;
