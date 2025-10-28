import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

type Category = { id: string; name_sq: string; slug: string; }
type Tag = { id: string; name: string; slug: string; }
type Story = {
  id?: string;
  title_sq: string; title_en: string;
  content_sq: string; content_en: string;
  excerpt_sq?: string;
  category_id?: string | null;
  cover_image_url?: string | null;
  seo_title?: string | null; seo_description?: string | null; seo_keywords?: string[] | null;
  featured?: boolean; status?: 'draft'|'pending'|'published'|'rejected';
  read_time_minutes?: number | null;
};

export default function AdminStories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [form, setForm] = useState<Story>({
    title_sq:"", title_en:"", content_sq:"", content_en:"",
    status: "draft", featured:false, seo_keywords:[]
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("categories").select("id,name_sq,slug").order("name_sq");
      setCategories(cats || []);
      const { data: t } = await supabase.from("tags").select("id,name,slug").order("name");
      setTags(t || []);
      const { data: s } = await supabase.from("stories").select("*").order("created_at", { ascending: false });
      setStories(s || []);
    })();
  }, []);

  const onUploadCover = async (file: File) => {
    try {
      setUploading(true);
      const fname = `${crypto.randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage.from("covers").upload(fname, file, { upsert: false });
      if (error) throw error;
      const url = supabase.storage.from("covers").getPublicUrl(data.path).data.publicUrl;
      setForm(prev => ({ ...prev, cover_image_url: url }));
      toast({ title: "Cover uploaded" });
    } catch (e:any) {
      toast({ title: "Upload failed", description: e.message || String(e) });
    } finally {
      setUploading(false);
    }
  };

  const saveStory = async () => {
    const payload = { ...form };
    const isEdit = Boolean(form.id);
    const table = supabase.from("stories");
    const res = isEdit ? await table.update(payload).eq("id", form.id!) : await table.insert(payload).select().single();
    if (res.error) { toast({ title:"Save failed", description: res.error.message }); return; }
    const storyId = isEdit ? form.id! : res.data.id;

    // upsert tags
    if (selectedTags.length) {
      await supabase.from("story_tags").delete().eq("story_id", storyId);
      await supabase.from("story_tags").insert(selectedTags.map(tag_id => ({ story_id: storyId, tag_id })));
    }

    await supabase.rpc("log_activity", {
      p_action: isEdit ? "update_story" : "create_story",
      p_entity_type: "story",
      p_entity_id: storyId,
      p_diff: payload as any
    });

    setForm({ title_sq:"", title_en:"", content_sq:"", content_en:"", status:"draft", featured:false, seo_keywords:[] });
    setSelectedTags([]);
    const { data: s2 } = await supabase.from("stories").select("*").order("created_at", { ascending: false });
    setStories(s2 || []);
    toast({ title: isEdit ? "Updated" : "Created" });
  };

  const edit = (s:any) => {
    setForm(s);
    (async ()=>{
      const { data: st } = await supabase.from("story_tags").select("tag_id").eq("story_id", s.id);
      setSelectedTags((st||[]).map((x:any)=>x.tag_id));
    })();
  };

  const del = async (id:string) => {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) { toast({ title:"Delete failed", description:error.message }); return; }
    await supabase.rpc("log_activity", { p_action:"delete_story", p_entity_type:"story", p_entity_id:id });
    setStories(stories.filter(s=>s.id!==id));
    toast({ title: "Deleted" });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Input placeholder="Title (SQ)" value={form.title_sq} onChange={e=>setForm({...form, title_sq:e.target.value})}/>
        <Input placeholder="Title (EN)" value={form.title_en} onChange={e=>setForm({...form, title_en:e.target.value})}/>
        <Textarea placeholder="Content (SQ)" value={form.content_sq} onChange={e=>setForm({...form, content_sq:e.target.value})}/>
        <Textarea placeholder="Content (EN)" value={form.content_en} onChange={e=>setForm({...form, content_en:e.target.value})}/>
        <Textarea placeholder="Excerpt (SQ)" value={form.excerpt_sq || ""} onChange={e=>setForm({...form, excerpt_sq:e.target.value})}/>

        <div className="grid grid-cols-2 gap-2">
          <Select onValueChange={(v)=>setForm({...form, category_id: v})} value={form.category_id || ""}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c=> <SelectItem key={c.id} value={c.id}>{c.name_sq}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.featured} onCheckedChange={(v)=>setForm({...form, featured:v})}/>
            <span>Featured</span>
          </div>
        </div>

        <Input placeholder="SEO title" value={form.seo_title || ""} onChange={e=>setForm({...form, seo_title:e.target.value})}/>
        <Input placeholder="SEO description" value={form.seo_description || ""} onChange={e=>setForm({...form, seo_description:e.target.value})}/>
        <Input placeholder="SEO keywords (comma separated)"
               value={(form.seo_keywords||[]).join(",")}
               onChange={e=>setForm({...form, seo_keywords: e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})}/>

        <div className="space-y-2">
          <label className="text-sm">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <button key={t.id}
                onClick={()=> setSelectedTags(prev => prev.includes(t.id) ? prev.filter(x=>x!==t.id) : [...prev, t.id])}
                className={`text-xs px-2 py-1 rounded border ${selectedTags.includes(t.id) ? 'bg-primary text-primary-foreground' : ''}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Cover Image</label>
          <Input type="file" accept="image/*" onChange={e=> e.target.files?.[0] && onUploadCover(e.target.files[0])}/>
          {form.cover_image_url && <img src={form.cover_image_url} alt="cover" className="h-24 rounded" />}
        </div>

        <div className="flex gap-2">
          <Button onClick={()=>setForm({...form, status:'published'})}>Set Published</Button>
          <Button onClick={saveStory}>Save</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map(s=>(
              <TableRow key={s.id}>
                <TableCell className="max-w-[220px] truncate">{s.title_sq}</TableCell>
                <TableCell>{s.status}</TableCell>
                <TableCell>{s.featured ? "Yes":"No"}</TableCell>
                <TableCell>{s.views ?? 0}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={()=>edit(s)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={()=>del(s.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
