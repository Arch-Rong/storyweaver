export type Chapter = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export type NovelProject = {
  id: string;
  title: string;
  synopsis: string;
  coverUrl?: string;
  chapters: Chapter[];
  activeChapterId: string;
  updatedAt: string;
};

export type NovelLibrary = {
  projects: NovelProject[];
};

export type ProjectSummary = {
  id: string;
  title: string;
  synopsis: string;
  coverUrl?: string;
  chapterCount: number;
  wordCount: number;
  updatedAt: string;
};

const LIBRARY_PREFIX = "storyweaver_library_";
const LEGACY_PREFIX = "storyweaver_novel_";

function libraryKey(username: string): string {
  return `${LIBRARY_PREFIX}${username}`;
}

function legacyKey(username: string): string {
  return `${LEGACY_PREFIX}${username}`;
}

function createChapter(order: number): Chapter {
  const now = new Date().toISOString();
  return {
    id: `chapter-${order}-${now}`,
    title: `第 ${order} 章`,
    content: "",
    updatedAt: now,
  };
}

export function createDefaultProject(): NovelProject {
  const firstChapter = createChapter(1);
  const now = new Date().toISOString();

  return {
    id: `project-${now}`,
    title: "未命名作品",
    synopsis: "",
    chapters: [firstChapter],
    activeChapterId: firstChapter.id,
    updatedAt: now,
  };
}

function normalizeProject(project: NovelProject): NovelProject {
  if (!project.chapters?.length) {
    return createDefaultProject();
  }

  if (!project.activeChapterId) {
    const firstChapter = project.chapters[0];
    if (firstChapter) {
      return { ...project, activeChapterId: firstChapter.id };
    }
  }

  return project;
}

function readLibraryRaw(username: string): NovelLibrary | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(libraryKey(username));
  if (!raw) {
    return null;
  }

  try {
    const library = JSON.parse(raw) as NovelLibrary;
    if (!Array.isArray(library.projects)) {
      return null;
    }
    return {
      projects: library.projects.map(normalizeProject),
    };
  } catch {
    return null;
  }
}

function migrateLegacyLibrary(username: string): NovelLibrary {
  if (typeof window === "undefined") {
    return { projects: [createDefaultProject()] };
  }

  const legacyRaw = window.localStorage.getItem(legacyKey(username));
  if (legacyRaw) {
    try {
      const project = normalizeProject(JSON.parse(legacyRaw) as NovelProject);
      window.localStorage.removeItem(legacyKey(username));
      const library = { projects: [project] };
      saveLibrary(username, library);
      return library;
    } catch {
      window.localStorage.removeItem(legacyKey(username));
    }
  }

  const library = { projects: [createDefaultProject()] };
  saveLibrary(username, library);
  return library;
}

export function loadLibrary(username: string): NovelLibrary {
  const existing = readLibraryRaw(username);
  if (existing) {
    if (existing.projects.length === 0) {
      const library = { projects: [createDefaultProject()] };
      saveLibrary(username, library);
      return library;
    }
    return existing;
  }

  return migrateLegacyLibrary(username);
}

export function saveLibrary(username: string, library: NovelLibrary): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(libraryKey(username), JSON.stringify(library));
}

export function loadProject(username: string, projectId: string): NovelProject | null {
  const library = loadLibrary(username);
  const project = library.projects.find((item) => item.id === projectId);
  return project ? normalizeProject(project) : null;
}

export function saveProject(username: string, project: NovelProject): void {
  const library = loadLibrary(username);
  const nextProject = {
    ...normalizeProject(project),
    updatedAt: new Date().toISOString(),
  };

  const index = library.projects.findIndex((item) => item.id === nextProject.id);
  if (index >= 0) {
    library.projects[index] = nextProject;
  } else {
    library.projects.unshift(nextProject);
  }

  saveLibrary(username, library);
}

export type CreateProjectInput = {
  title?: string;
  synopsis?: string;
};

export type UpdateProjectMetaInput = {
  title?: string;
  synopsis?: string;
  coverUrl?: string | null;
};

export function updateProjectMeta(
  username: string,
  projectId: string,
  input: UpdateProjectMetaInput,
): NovelProject | null {
  const library = loadLibrary(username);
  const index = library.projects.findIndex((item) => item.id === projectId);
  if (index < 0) {
    return null;
  }

  const current = library.projects[index];
  if (!current) {
    return null;
  }

  const nextProject: NovelProject = {
    ...current,
    title: input.title !== undefined ? input.title.trim() || "未命名作品" : current.title,
    synopsis: input.synopsis !== undefined ? input.synopsis.trim() : current.synopsis,
    coverUrl:
      input.coverUrl === null
        ? undefined
        : input.coverUrl !== undefined
          ? input.coverUrl
          : current.coverUrl,
    updatedAt: new Date().toISOString(),
  };

  library.projects[index] = nextProject;
  saveLibrary(username, library);
  return nextProject;
}

export function deleteProject(username: string, projectId: string): boolean {
  const library = loadLibrary(username);
  const nextProjects = library.projects.filter((item) => item.id !== projectId);
  if (nextProjects.length === library.projects.length) {
    return false;
  }

  saveLibrary(username, { projects: nextProjects });
  return true;
}

export function createProject(username: string, input: CreateProjectInput = {}): NovelProject {
  const project = createDefaultProject();
  const trimmedTitle = input.title?.trim();
  const trimmedSynopsis = input.synopsis?.trim() ?? "";

  project.title = trimmedTitle || project.title;
  project.synopsis = trimmedSynopsis;

  const library = loadLibrary(username);
  library.projects.unshift(project);
  saveLibrary(username, library);
  return project;
}

export function listProjectSummaries(username: string): ProjectSummary[] {
  const library = loadLibrary(username);

  return library.projects
    .map((project) => ({
      id: project.id,
      title: project.title || "未命名作品",
      synopsis: project.synopsis,
      coverUrl: project.coverUrl,
      chapterCount: project.chapters.length,
      wordCount: project.chapters.reduce(
        (total, chapter) => total + countWords(chapter.content),
        0,
      ),
      updatedAt: project.updatedAt,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function addChapter(project: NovelProject): NovelProject {
  const chapter = createChapter(project.chapters.length + 1);
  return {
    ...project,
    chapters: [...project.chapters, chapter],
    activeChapterId: chapter.id,
    updatedAt: new Date().toISOString(),
  };
}

export function countWords(text: string): number {
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!plain) {
    return 0;
  }

  const cjk = plain.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latin = plain
    .replace(/[\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return cjk + latin;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();

  if (diff < 60_000) {
    return "刚刚";
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`;
  }
  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)} 小时前`;
  }
  if (diff < 604_800_000) {
    return `${Math.floor(diff / 86_400_000)} 天前`;
  }

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}
