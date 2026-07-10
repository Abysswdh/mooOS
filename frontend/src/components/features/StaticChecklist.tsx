'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

const STATIC_TASKS = [
  { id: 1, title: 'Beri pakan sapi (Pagi)', description: 'Pastikan pakan cukup untuk semua sapi di kandang.' },
  { id: 2, title: 'Peras susu (Pagi)', description: 'Lakukan pemerahan susu pagi hari dan catat hasilnya.' },
  { id: 3, title: 'Bersihkan kandang', description: 'Bersihkan kandang dari kotoran dan pastikan kebersihan terjaga.' },
  { id: 4, title: 'Kumpulkan limbah', description: 'Kumpulkan kotoran untuk diproses menjadi pupuk.' },
  { id: 5, title: 'Beri pakan sapi (Sore)', description: 'Pemberian pakan sore hari.' },
  { id: 6, title: 'Peras susu (Sore)', description: 'Pemerahan susu sore hari.' },
];

export function StaticChecklist() {
  // In a real app, this state should ideally be persisted to DB or localStorage
  // For the frontend phase 2, we simulate this with local state per session.
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>([]);

  const toggleTask = (id: number) => {
    setCompletedTaskIds((prev) => 
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const pendingTasks = STATIC_TASKS.filter(t => !completedTaskIds.includes(t.id));
  const completedCount = completedTaskIds.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Tugas Rutin Kandang</CardTitle>
            <CardDescription>Selesai: {completedCount} / {STATIC_TASKS.length}</CardDescription>
          </div>
          <div className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {pendingTasks.length} tugas
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {pendingTasks.length === 0 ? (
          <EmptyState
            title="Semua tugas rutin selesai!"
            description="Kandang sudah beres untuk hari ini."
          />
        ) : (
          <div className="divide-y">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-4 flex gap-4 hover:bg-muted/50 transition-colors">
                <button
                  className="mt-1 flex-shrink-0 text-muted-foreground hover:text-blue-600 transition-colors"
                  onClick={() => toggleTask(task.id)}
                >
                  <Circle className="w-6 h-6" />
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      RUTIN
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
