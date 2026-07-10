import { FolderX } from "lucide-react";

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang dapat ditampilkan saat ini.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted p-4 rounded-full mb-4">
        <FolderX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
