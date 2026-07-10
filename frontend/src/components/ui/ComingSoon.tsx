import { Clock } from "lucide-react";

export function ComingSoon({ title = "Segera Hadir" }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed rounded-xl bg-muted/20">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Clock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">
        Fitur ini sedang dalam tahap pengembangan dan akan segera tersedia untuk Anda.
      </p>
    </div>
  );
}
