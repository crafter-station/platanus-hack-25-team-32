import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, Project, Service, Deployment } from "@/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the project
  const [project] = await db
    .select()
    .from(Project)
    .where(eq(Project.id, id))
    .limit(1);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.user_id !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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

  // Structure the data
  const projectWithData = {
    ...project,
    services: services.map((service) => ({
      ...service,
      deployments: deployments.filter((d) => d.service_id === service.id),
    })),
  };

  return Response.json(projectWithData);
}
