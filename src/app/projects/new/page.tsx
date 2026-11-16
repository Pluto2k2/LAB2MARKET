import { ActionForm, SubmitButton } from "@/components/action-form";
import { ProjectFields } from "@/components/project-fields";
import { requireUser } from "@/lib/session";
import { createProject } from "../actions";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireUser("RESEARCHER");
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">New project</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy">Describe your research</h1>
      <ActionForm action={createProject} className="card mt-6 space-y-5">
        <ProjectFields />
        <SubmitButton pendingText="Creating…">Create project</SubmitButton>
      </ActionForm>
    </div>
  );
}
