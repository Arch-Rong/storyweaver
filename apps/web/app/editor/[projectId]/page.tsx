import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { normalizeProjectId } from "@/lib/paths";

type EditorPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;
  return <EditorWorkspace projectId={normalizeProjectId(projectId)} />;
}
