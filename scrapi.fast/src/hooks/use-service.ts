import { useQuery } from "@tanstack/react-query";
import type { ServiceSelect } from "@/db/schema/service";

async function fetchService(id: string): Promise<ServiceSelect> {
  const response = await fetch(`/api/get-service?id=${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch service");
  }
  return response.json();
}

export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => fetchService(serviceId!),
    enabled: !!serviceId,
    refetchInterval: 5000,
  });
}
