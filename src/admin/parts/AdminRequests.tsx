import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

export default function AdminRequests() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("admin_requests").select("id,email,status,created_at,user_id").order("created_at");
    setRows(data || []);
  };
  useEffect(()=>{ load(); },[]);

  const act = async (id:string, status:'approved'|'rejected') => {
    const { error } = await supabase.rpc("set_admin_request_status", { p_request_id: id, p_status: status });
    if (error) return toast({ title:"Error", description:error.message });
    toast({ title: status === 'approved' ? "Approved" : "Rejected" });
    load();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r=>(
          <TableRow key={r.id}>
            <TableCell>{r.email}</TableCell>
            <TableCell>{r.status}</TableCell>
            <TableCell className="space-x-2">
              {r.status==='pending' && <>
                <Button size="sm" onClick={()=>act(r.id,'approved')}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={()=>act(r.id,'rejected')}>Reject</Button>
              </>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
