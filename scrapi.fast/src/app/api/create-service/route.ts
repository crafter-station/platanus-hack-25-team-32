import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db, Service } from "@/db";
import { nanoid } from "nanoid";
import { tasks } from "@trigger.dev/sdk/v3";
import type { getScriptTask } from "@/trigger/get-script.task";

export async function POST(request: Request) {
  const { url, prompt, projectId } = await request.json();

  if (!url || !prompt || !projectId) {
    return Response.json(
      { error: "Missing required fields: url, prompt, projectId" },
      { status: 400 },
    );
  }

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      name: z.string().describe("A short name for this scraping service"),
      description: z
        .string()
        .describe("Brief description of what the service does"),
      inputSchemaString: z
        .string()
        .describe(
          "A Zod schema string for input parameters (e.g., 'z.object({ id: z.string() })')",
        ),
      outputSchemaString: z
        .string()
        .describe(
          "A Zod schema string for expected output data (e.g., 'z.array(z.object({ name: z.string(), price: z.number() }))')",
        ),
      testArgsString: z
        .string()
        .describe(
          "Example test arguments as a JavaScript object literal matching the input schema (e.g., '{ id: \"123\" }')",
        ),
    }),
    prompt: `You are creating a web scraping service configuration.

URL to scrape: ${url}

User's request: ${prompt}

Generate the configuration for this scraping service:
1. name: A concise name for this service (2-4 words)
2. description: What data this service extracts
3. inputSchemaString: Zod schema for any input parameters needed (use z.object({}) if no input needed)
4. outputSchemaString: Zod schema for the data structure that will be returned
5. testArgsString: Example arguments to test the scraper with

Make sure the schemas are valid Zod syntax that can be evaluated with new Function().`,
  });

  const serviceId = nanoid();

  await db.insert(Service).values({
    id: serviceId,
    project_id: projectId,
    name: object.name,
    description: object.description,
    url,
    script: "",
    schema_input: object.inputSchemaString,
    schema_output: object.outputSchemaString,
    example_input: object.testArgsString,
  });

  const handle = await tasks.trigger<typeof getScriptTask>("get-script", {
    url,
    userPrompt: prompt,
    inputSchemaString: object.inputSchemaString,
    outputSchemaString: object.outputSchemaString,
    testArgsString: object.testArgsString,
  });

  return Response.json({
    serviceId,
    taskId: handle.id,
  });
}
