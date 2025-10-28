import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const FeaturedStories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("stories")
      .select(`
        id,
        title_sq,
        title_en,
        content_sq,
        content_en,
        image_url,
        published_at,
        views,
        status,
        read_time_minutes,
        categories(id, name_sq, name_en)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching stories:", error);
      setStories([]);
    } else {
      setStories(data || []);
    }

    setLoading(false);
  };

  const filteredStories = stories.filter((story) =>
    story.title_sq?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.content_sq?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Duke u ngarkuar... / Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Historitë e Zgjedhura
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Lexo historitë më intriguese dhe më të komentuara nga komuniteti ynë
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kërko histori... / Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm
                ? "Nuk u gjet asnjë histori / No stories found"
                : "Nuk ka histori të publikuara akoma / No published stories yet"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredStories.map((story, index) => (
              <Link key={story.id} to={`/story/${story.id}`}>
                <Card
                  className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-mystery cursor-pointer animate-slide-up h-full"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Image */}
                  {story.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={story.image_url}
                        alt={story.title_sq}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      {story.categories?.name_sq && (
                        <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm">
                          {story.categories.name_sq}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {story.title_sq}
                    </h3>
                    <p className="text-sm text-muted-foreground/70 mb-3 italic line-clamp-1">
                      {story.title_en}
                    </p>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {story.content_sq?.substring(0, 150)}...
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {story.views?.toLocaleString() || 0}
                        </span>
                      </div>
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

export default FeaturedStories;
