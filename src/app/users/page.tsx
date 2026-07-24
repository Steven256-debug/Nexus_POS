import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "../actions/users";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  const users = await getUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage system access, roles, and staff accounts.
        </p>
      </div>

      <UsersClient initialUsers={users} />
    </div>
  );
}
