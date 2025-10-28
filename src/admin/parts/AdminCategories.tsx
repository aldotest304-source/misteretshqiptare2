import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

export default function AdminCategories() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_sq");
    setList(data || []);
  };
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    const { error } = await supabase.from("categories").insert({ name_sq:name, name_en:name, slug });
    if (error) return toast({ title:"Error", description:error.message });
    await supabase.rpc("log_activity",{ p_action:"create_category", p_entity_type:"category", p_entity_id: slug });
    setName(""); setSlug(""); load();
  };

  const del = async (id:string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast({ title:"Error", description:error.message });
    await supabase.rpc("log_activity",{ p_action:"delete_category", p_entity_type:"category", p_entity_id: id });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
        <Input placeholder="Slug" value={slug} onChange={e=>setSlug(e.target.value)}/>
        <Button onClick={add}>Add</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead/></TableRow></TableHeader>
        <TableBody>
          {list.map(c=>(
            <TableRow key={c.id}>
              <TableCell>{c.name_sq}</TableCell>
              <TableCell>{c.slug}</TableCell>
              <TableCell><Button variant="destructive" size="sm" onClick={()=>del(c.id)}>Delete</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
