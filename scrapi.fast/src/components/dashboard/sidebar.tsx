"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Globe,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  services: Service[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Sidebar() {
  const router = useRouter();
  const { data: projects = [], error, isLoading } = useSWR<Project[]>("/api/projects", fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  });
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Auto-expand all projects when they load
  useEffect(() => {
    if (projects.length > 0 && expandedProjects.size === 0) {
      setExpandedProjects(new Set(projects.map(p => p.id)));
    }
  }, [projects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const filteredProjects = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesService = project.services?.some((service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description?.toLowerCase().includes(search.toLowerCase())
    );
    return matchesName || matchesService;
  });

  const handleCreateProject = async () => {
    if (!prompt.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/create-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      const result = await response.json();
      setIsNewProjectOpen(false);
      setPrompt("");

      // Redirect to dashboard with the service creation in progress
      router.push(`/dashboard?serviceId=${result.serviceId}&taskId=${result.taskId}`);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            PROJECTS
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsNewProjectOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="p-2 text-xs text-destructive">
            Failed to load projects
          </div>
        )}
        {!isLoading && !error && filteredProjects.map((project) => (
          <div key={project.id} className="mb-1">
            {/* Project */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => toggleProject(project.id)}
                className="flex items-center rounded px-1 py-1.5 hover:bg-accent"
              >
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
              </button>
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-medium">
                  {project.name}
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[9px] font-normal"
                >
                  {project.services.length}
                </Badge>
              </Link>
            </div>

            {/* Services */}
            {expandedProjects.has(project.id) && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {project.services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/dashboard/services/${service.id}`}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <Globe className="h-3 w-3 shrink-0 text-primary" />
                    <div className="flex-1 truncate">
                      <div className="font-medium font-mono">{service.name}</div>
                      {service.description && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Folder className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">No projects found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-start text-xs"
          onClick={() => setIsNewProjectOpen(true)}
        >
          <Plus className="mr-1.5 h-3 w-3" />
          New Project
        </Button>
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New API Service</DialogTitle>
            <DialogDescription>
              Describe what data you want to extract from a website. Include the URL and what information you need.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Example: Extract product names and prices from https://example.com/products"
                className="min-h-[120px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleCreateProject();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Be specific about the URL and the data you want to extract
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProjectOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!prompt.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
