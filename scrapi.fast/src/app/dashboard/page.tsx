"use client";

import { QueryInterface } from "@/components/dashboard/query-interface";
import { ServiceShowcase } from "@/components/dashboard/service-showcase";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const taskId = searchParams.get("taskId");

  // If we have query params, show the creation flow with panels
  if (serviceId) {
    return (
      <div className="flex h-full w-full bg-background">
        <div className="flex-1 border-r">
          <QueryInterface serviceId={serviceId} taskId={taskId} />
        </div>
        <div className="w-[500px]">
          <ServiceShowcase serviceId={serviceId} />
        </div>
      </div>
    );
  }

  // Otherwise show the default empty state
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <QueryInterface />
    </div>
  );
}
