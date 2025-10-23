import { db } from "@/lib/db";
import { ClientTable } from "@/components/ClientTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await db.client.findMany({
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Manage your client database</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
          <CardDescription>View and manage your imported clients</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTable clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
