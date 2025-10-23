import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      subscriptions: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{client.email}</h1>
        <p className="text-muted-foreground">Client details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {client.firstName || client.lastName
                  ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            )}
            {client.company && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{client.company}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.address1 && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{client.address1}</p>
                {client.address2 && <p className="font-medium">{client.address2}</p>}
              </div>
            )}
            {(client.city || client.state || client.postalCode) && (
              <div>
                <p className="text-sm text-muted-foreground">City, State ZIP</p>
                <p className="font-medium">
                  {[client.city, client.state, client.postalCode].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {client.country && (
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{client.country}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {client.tags.length > 0 ? (
                client.tags.map((t) => (
                  <Badge key={t.tagId} variant="secondary">
                    {t.tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            {client.subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between">
                <span className="text-sm capitalize">{sub.channel}</span>
                <Badge variant={sub.status === "subscribed" ? "default" : "secondary"}>
                  {sub.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Custom Fields Section */}
      {client.customFields && typeof client.customFields === "object" && Object.keys(client.customFields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Custom data imported from CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(client.customFields as Record<string, unknown>).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  <p className="text-sm font-semibold">
                    {value !== null && value !== undefined && String(value).trim() !== ""
                      ? String(value)
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
