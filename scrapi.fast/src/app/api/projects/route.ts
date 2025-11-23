import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { db, Project, Service } from "@/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all projects for the user
  const projects = await db
    .select()
    .from(Project)
    .where(eq(Project.user_id, userId));

  // Fetch all services for these projects
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return Response.json([]);
  }

  const services = await db
    .select()
    .from(Service)
    .where(inArray(Service.project_id, projectIds));

  // Structure the data hierarchically
  const projectsWithData = projects.map((project) => {
    const projectServices = services.filter(
      (s) => s.project_id === project.id,
    );

    return {
      ...project,
      services: projectServices,
    };
  });

  return Response.json(projectsWithData);
}
