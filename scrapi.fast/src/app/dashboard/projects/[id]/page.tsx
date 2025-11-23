import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, Project, Service, Deployment } from "@/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Rocket, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    return notFound();
  }

  const { id } = await params;

  // Fetch the project
  const [project] = await db
    .select()
    .from(Project)
    .where(eq(Project.id, id))
    .limit(1);

  if (!project || project.user_id !== userId) {
    return notFound();
  }

  // Fetch services for this project
  const services = await db
    .select()
    .from(Service)
    .where(eq(Service.project_id, id));

  const serviceIds = services.map((s) => s.id);

  // Fetch deployments for these services
  const deployments = serviceIds.length > 0
    ? await db.select().from(Deployment)
    : [];

  const servicesWithDeployments = services.map((service) => ({
    ...service,
    deployments: deployments.filter((d) => d.service_id === service.id),
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "building":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "draft":
        return "bg-gray-500";
      case "archived":
        return "bg-gray-400";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Project Header */}
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-2">{project.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created {formatDate(project.created_at)}</span>
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Services ({services.length})</h2>
        {servicesWithDeployments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No services yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {servicesWithDeployments.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.url && (
                          <CardDescription className="font-mono text-xs mt-1">
                            {service.url}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {service.deployments.length} {service.deployments.length === 1 ? "deployment" : "deployments"}
                    </Badge>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {service.deployments.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium mb-2">Deployments</h4>
                      {service.deployments.map((deployment) => (
                        <div
                          key={deployment.id}
                          className="flex items-center justify-between p-3 border rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Rocket className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getStatusColor(deployment.status)}`}
                              />
                              <span className="font-medium">{deployment.version}</span>
                              <Badge variant="outline" className="text-xs">
                                {deployment.status}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(deployment.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No deployments yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
