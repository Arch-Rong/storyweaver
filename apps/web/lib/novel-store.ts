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
  chapters: Chapter[];
  activeChapterId: string;
  updatedAt: string;
};

const STORAGE_PREFIX = "storyweaver_novel_";

function storageKey(username: string): string {
  return `${STORAGE_PREFIX}${username}`;
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

export function loadProject(username: string): NovelProject {
  if (typeof window === "undefined") {
    return createDefaultProject();
  }

  const raw = window.localStorage.getItem(storageKey(username));
  if (!raw) {
    const project = createDefaultProject();
    saveProject(username, project);
    return project;
  }

  try {
    const project = JSON.parse(raw) as NovelProject;
    if (!project.chapters?.length) {
      return createDefaultProject();
    }
    if (!project.activeChapterId) {
      const firstChapter = project.chapters[0];
      if (firstChapter) {
        project.activeChapterId = firstChapter.id;
      }
    }
    return project;
  } catch {
    const project = createDefaultProject();
    saveProject(username, project);
    return project;
  }
}

export function saveProject(username: string, project: NovelProject): void {
  const next = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey(username), JSON.stringify(next));
}

export function addChapter(project: NovelProject): NovelProject {
  const chapter = createChapter(project.chapters.length + 1);
  return {
    ...project,
    chapters: [...project.chapters, chapter],
    activeChapterId: chapter.id,
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
