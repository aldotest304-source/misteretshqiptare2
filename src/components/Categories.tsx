import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Ghost, Users, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const fetchCategoryCounts = async () => {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug");

    if (categories) {
      const counts: Record<string, number> = {};
      
      for (const category of categories) {
        const { count } = await supabase
          .from("stories")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id)
          .eq("status", "published");
        
        counts[category.slug] = count || 0;
      }
      
      setCategoryCounts(counts);
    }
  };

  const iconMap: Record<string, any> = {
    "legjenda-urbane": Ghost,
    "historite-tuaja": Users,
    "kuriozitete-globale": Globe2,
  };

  const gradientMap: Record<string, string> = {
    "legjenda-urbane": "from-primary/20 to-primary/5",
    "historite-tuaja": "from-accent/20 to-accent/5",
    "kuriozitete-globale": "from-primary-glow/20 to-primary-glow/5",
  };

  const categories = [
    {
      slug: "legjenda-urbane",
      title: {
        sq: "Legjenda Urbane",
        en: "Urban Legends",
      },
      description: {
        sq: "Histori mistike nga rrugët e Shqipërisë dhe më gjerë",
        en: "Mystical stories from Albanian streets and beyond",
      },
    },
    {
      slug: "historite-tuaja",
      title: {
        sq: "Historitë Tuaja",
        en: "Your Stories",
      },
      description: {
        sq: "Përvojat e vërteta të lexuesve tanë",
        en: "True experiences from our readers",
      },
    },
    {
      slug: "kuriozitete-globale",
      title: {
        sq: "Kuriozitete Globale",
        en: "Global Curiosities",
      },
      description: {
        sq: "Mistere dhe ngjarje të pazgjidhura nga bota",
        en: "Mysteries and unsolved events from around the world",
      },
    },
  ];

  return (
    <section id="categories" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Kategoritë
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Eksploro botën tonë të mistershme të organizuar në tre kategori kryesore
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const Icon = iconMap[category.slug] || Ghost;
            const gradient = gradientMap[category.slug] || "from-primary/20 to-primary/5";
            const count = categoryCounts[category.slug] || 0;
            
            return (
              <Card
                key={index}
                className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative p-8">
                  <div className="mb-6 inline-flex p-4 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {category.title.sq}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 mb-3">{category.title.en}</p>
                  
                  <p className="text-muted-foreground mb-4">
                    {category.description.sq}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-accent font-semibold">
                      {count} {count === 1 ? 'Histori' : 'Histori'}
                    </span>
                    <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;