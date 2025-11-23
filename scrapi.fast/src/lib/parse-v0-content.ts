export interface ParsedCodeFile {
  filename: string;
  filepath: string;
  language: string;
  content: string;
}

export interface ParsedV0Content {
  hasCodeProject: boolean;
  files: ParsedCodeFile[];
  textContent: string;
}

export function parseV0Content(content: string): ParsedV0Content {
  // Check if content contains V0_FILE markers or code project indicators
  const hasCodeMarkers = content.includes("[V0_FILE]") ||
                         content.includes("Code Project") ||
                         content.includes("📁") ||
                         content.includes("📄");

  if (!hasCodeMarkers) {
    return {
      hasCodeProject: false,
      files: [],
      textContent: content,
    };
  }

  const files: ParsedCodeFile[] = [];
  let textContent = content;

  // Regex to match V0_FILE patterns
  // Pattern: [V0_FILE]language:file="path"
  // followed by content until next [V0_FILE] or end
  const fileRegex = /\[V0_FILE\](\w+):file="([^"]+)"\n([\s\S]*?)(?=\[V0_FILE\]|$)/g;

  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const [fullMatch, language, filepath, rawContent] = match;

    // Extract filename from filepath
    const filename = filepath.split("/").pop() || filepath;

    // Clean up content - remove "... shell ..." markers and extra whitespace
    const cleanContent = rawContent
      .replace(/\.\.\. shell \.\.\./g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleanContent) {
      files.push({
        filename,
        filepath,
        language: language.toLowerCase(),
        content: cleanContent,
      });
    }

    // Remove this file block from text content
    textContent = textContent.replace(fullMatch, "");
  }

  // Aggressive cleaning of v0 artifacts
  textContent = textContent
    // Remove emoji-based file listings
    .replace(/[📁📄🗂️].*?(?:\n|$)/g, "")
    // Remove version indicators
    .replace(/\s*v\d+\s*/g, "")
    // Remove all V0_FILE markers
    .replace(/\[V0_FILE\].*$/gm, "")
    // Remove shell markers
    .replace(/\.\.\. shell \.\.\./g, "")
    // Remove file path patterns like app/page.tsx
    .replace(/\b(?:app|src|lib|components)\/[\w.-\/]+\.(?:tsx?|jsx?|css|json)\b/g, "")
    // Remove "Code Project" text
    .replace(/Code Project/gi, "")
    // Remove extra newlines
    .replace(/\n{3,}/g, "\n\n")
    // Remove lines with only whitespace, emojis or special chars
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      // Keep lines with actual content (not just emojis/whitespace)
      return trimmed.length > 0 && /[a-zA-Z0-9]/.test(trimmed);
    })
    .join("\n")
    .trim();

  // If after cleaning there's only whitespace or very short content, don't show it
  if (textContent.length < 20 || /^[\s\n]*$/.test(textContent)) {
    textContent = "";
  }

  return {
    hasCodeProject: files.length > 0,
    files,
    textContent,
  };
}
