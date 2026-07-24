import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "../actions/audit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  const logs = await getAuditLogs();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor sensitive system activities and staff actions.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{log.user?.name || log.user?.email || 'System'}</div>
                    {log.user?.role && <div className="text-xs text-muted-foreground">{log.user.role}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-background">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{log.entity}</span>
                    {log.entityId && <span className="text-xs text-muted-foreground ml-1">({log.entityId.slice(0,8)})</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.details || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
