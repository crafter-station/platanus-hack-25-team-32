import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, Service } from "@/db";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json(
      { error: "Missing required parameter: id" },
      { status: 400 },
    );
  }

  const [service] = await db
    .select()
    .from(Service)
    .where(eq(Service.id, id))
    .limit(1);

  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  return Response.json(service);
}
