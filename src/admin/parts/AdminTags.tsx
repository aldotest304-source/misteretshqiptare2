import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

export default function AdminTags() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    setList(data || []);
  };
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    const { error } = await supabase.from("tags").insert({ name, slug });
    if (error) return toast({ title:"Error", description:error.message });
    await supabase.rpc("log_activity",{ p_action:"create_tag", p_entity_type:"tag", p_entity_id: slug });
    setName(""); setSlug(""); load();
  };

  const del = async (id:string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) return toast({ title:"Error", description:error.message });
    await supabase.rpc("log_activity",{ p_action:"delete_tag", p_entity_type:"tag", p_entity_id: id });
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
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.slug}</TableCell>
              <TableCell><Button variant="destructive" size="sm" onClick={()=>del(c.id)}>Delete</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
