import { Card } from "@/components/ui/card"
import { Eye, Heart, MessageSquare, BookOpen } from "lucide-react"

interface StatsHeaderProps {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalStories: number
}

export default function StatsHeader({
  totalViews,
  totalLikes,
  totalComments,
  totalStories,
}: StatsHeaderProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-card border-border p-4 shadow-card flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Views
          </span>
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground leading-none">
          {totalViews.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Shikime totale të historive
        </div>
      </Card>

      <Card className="bg-card border-border p-4 shadow-card flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Likes
          </span>
          <Heart className="h-4 w-4 text-accent" />
        </div>
        <div className="text-2xl font-bold text-foreground leading-none">
          {totalLikes.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Pëlqime totale (❤️)
        </div>
      </Card>

      <Card className="bg-card border-border p-4 shadow-card flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Approved Comments
          </span>
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground leading-none">
          {totalComments.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Komente të miratuara
        </div>
      </Card>

      <Card className="bg-card border-border p-4 shadow-card flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Stories Published
          </span>
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground leading-none">
          {totalStories.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Artikuj aktivë në faqen kryesore
        </div>
      </Card>
    </div>
  )
}
