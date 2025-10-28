import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminActivity() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(()=>{
    (async()=>{
      const { data } = await supabase
        .from("activity_log")
        .select("created_at, action, entity_type, entity_id, diff")
        .order("created_at", { ascending:false })
        .limit(200);
      setRows(data || []);
    })();
  },[]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Payload</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r,i)=>(
          <TableRow key={i}>
            <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
            <TableCell>{r.action}</TableCell>
            <TableCell>{r.entity_type}#{r.entity_id}</TableCell>
            <TableCell className="max-w-[360px] truncate">{JSON.stringify(r.diff)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
