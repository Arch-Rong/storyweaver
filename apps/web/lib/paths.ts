export function getEditorPath(projectId: string): string {
  return `/editor/${encodeURIComponent(projectId)}`;
}

export function normalizeProjectId(projectId: string): string {
  try {
    return decodeURIComponent(projectId);
  } catch {
    return projectId;
  }
}
