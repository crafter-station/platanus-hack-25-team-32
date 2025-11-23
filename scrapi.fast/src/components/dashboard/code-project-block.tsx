"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Folder, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Badge } from "@/components/ui/badge";

interface CodeFile {
  filename: string;
  filepath: string;
  language: string;
  content: string;
}

interface CodeProjectBlockProps {
  version?: string;
  files: CodeFile[];
  className?: string;
}

export function CodeProjectBlock({
  version = "v1",
  files,
  className,
}: CodeProjectBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const selectedFileData = files.find((f) => f.filepath === selectedFile);

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Folder className="size-4 text-blue-500" />
          <span className="font-medium text-sm">Code Project</span>
          <Badge variant="outline" className="text-xs">
            {version}
          </Badge>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t">
              {/* File List */}
              <div className="bg-muted/20 p-2 space-y-1 max-h-48 overflow-y-auto">
                {files.map((file) => (
                  <button
                    key={file.filepath}
                    onClick={() =>
                      setSelectedFile(
                        selectedFile === file.filepath ? null : file.filepath
                      )
                    }
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors",
                      selectedFile === file.filepath && "bg-muted"
                    )}
                  >
                    {file.language === "typescript" ||
                    file.language === "typescriptreact" ? (
                      <FileText className="size-3 text-blue-400 shrink-0" />
                    ) : file.language === "javascript" ? (
                      <FileText className="size-3 text-yellow-400 shrink-0" />
                    ) : file.language === "json" ? (
                      <File className="size-3 text-green-400 shrink-0" />
                    ) : (
                      <File className="size-3 text-gray-400 shrink-0" />
                    )}
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="font-medium truncate">
                        {file.filename}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {file.filepath}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* File Content */}
              <AnimatePresence mode="wait">
                {selectedFileData && (
                  <motion.div
                    key={selectedFileData.filepath}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="border-t"
                  >
                    <div className="p-2 bg-muted/10 border-b">
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="size-3" />
                        <span className="font-mono">
                          {selectedFileData.filename}
                        </span>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <CodeBlock
                        code={selectedFileData.content}
                        language={selectedFileData.language as any}
                        showLineNumbers={true}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
