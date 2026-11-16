import { ProjectTabs } from "@/components/project-tabs";
import { getOwnedProject } from "@/lib/access";
import { requireUser } from "@/lib/session";
import { TRL_LABELS } from "@/lib/constants";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("RESEARCHER");
  const project = await getOwnedProject(id, user);
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{project.field}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">{project.title}</h1>
        <p className="mt-2 text-sm text-slate">
          TRL {project.trl}: {TRL_LABELS[project.trl - 1]}
        </p>
      </div>
      <ProjectTabs id={project.id} />
      {children}
    </div>
  );
}
