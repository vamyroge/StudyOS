import { requireAuth } from "@/lib/auth/utils";
import { createClient } from "@/lib/supabase/server";
import { ProtectedLayout } from "@/components/protected-layout";

export default async function KnowledgePage() {
  await requireAuth();
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, file_type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <ProtectedLayout>
      <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">Cơ sở kiến thức</h1>
      <p className="mt-2 text-muted-foreground">Tài liệu và nội dung học tập.</p>

      {!documents || documents.length === 0 ? (
        <div className="mt-8 rounded-lg border p-8 text-center text-muted-foreground">
          <p>Chưa có tài liệu nào.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{doc.file_type}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString("vi-VN")}
              </span>
            </li>
          ))}
        </ul>
      )}
      </div>
    </ProtectedLayout>
  );
}
