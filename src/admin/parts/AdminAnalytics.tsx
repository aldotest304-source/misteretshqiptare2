import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminAnalytics() {
  const [top, setTop] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stories")
        .select("id,title_sq,views,like_count,featured")
        .order("views", { ascending:false })
        .limit(20);
      setTop(data || []);
    })();
  }, []);

  return (
    <div>
      <h2 className="font-semibold mb-2">Top Stories (Views)</h2>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Title</TableHead><TableHead>Views</TableHead><TableHead>Likes</TableHead><TableHead>Featured</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {top.map(s=>(
            <TableRow key={s.id}>
              <TableCell className="max-w-[280px] truncate">{s.title_sq}</TableCell>
              <TableCell>{s.views ?? 0}</TableCell>
              <TableCell>{s.like_count ?? 0}</TableCell>
              <TableCell>{s.featured ? "Yes":"No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
