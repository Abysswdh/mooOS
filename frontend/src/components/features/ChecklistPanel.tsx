'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChecklist } from '@/hooks/useChecklist';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckCircle2, Circle, AlertCircle, ExternalLink, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChecklistPriority, ChecklistActionType } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';



export function ChecklistPanel() {
  const { tasks, isLoading, error, refetch, completeTask } = useChecklist();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAction = (action_type: string, payload: string | null) => {
    switch (action_type as ChecklistActionType) {
      case 'NAVIGATE':
        if (payload) router.push(payload);
        break;
      case 'CREATE_PO':
        router.push('/dashboard/pakan'); // They can open FeedOrderModal from there
        break;
      default:
        // Other actions might be handled inside the page component or globally
        break;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sistem Pintar MooOS (MRP)</CardTitle>
          <CardDescription>Menganalisis data kandang...</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sistem Pintar MooOS (MRP)</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={error} onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600" />
          Analisis Sistem (MRP)
        </h2>
        <p className="text-sm text-slate-500 mt-1">Selesai: {completedCount} / {tasks.length} | {pendingTasks.length} issue tersisa</p>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {pendingTasks.length === 0 ? (
          <EmptyState
            title="Semua issue selesai!"
            description="Kandang sudah beres untuk shift ini."
          />
        ) : (
          <div className="flex-1 space-y-4">
            {pendingTasks.map((task) => {
              const isHigh = task.priority === 'HIGH';
              const isMedium = task.priority === 'MEDIUM';
              const colorClass = isHigh ? 'bg-rose-50 border-rose-500' : isMedium ? 'bg-amber-50 border-amber-500' : 'bg-emerald-50 border-emerald-500';
              const textClass = isHigh ? 'text-rose-800' : isMedium ? 'text-amber-800' : 'text-emerald-800';
              const descClass = isHigh ? 'text-rose-700/80' : isMedium ? 'text-amber-700/80' : 'text-emerald-700/80';
              const btnClass = isHigh ? 'bg-rose-600 hover:bg-rose-700 text-white' : isMedium ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white';

              return (
                <div 
                  key={task.id}
                  className={cn("p-4 rounded-xl border-l-4 shadow-sm flex flex-col gap-3 transition-colors", colorClass)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={cn("font-bold", textClass)}>
                        {task.title}
                      </h3>
                      <p className={cn("text-sm mt-1 leading-relaxed", descClass)}>
                        {task.description}
                      </p>
                    </div>
                    {isHigh ? (
                      <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                    ) : isMedium ? (
                      <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    {task.action_type && task.action_type !== 'NONE' && (
                      <Button 
                        size="sm" 
                        className={cn("h-8 text-xs font-semibold px-4 rounded-full border-none", btnClass)}
                        onClick={() => handleAction(task.action_type, task.action_payload)}
                      >
                        {task.action_type === 'CREATE_PO' ? (
                          <><PlusCircle className="w-4 h-4 mr-1.5" /> Buat PO Pakan</>
                        ) : task.action_type === 'NAVIGATE' ? (
                          <><ExternalLink className="w-4 h-4 mr-1.5" /> Buka Halaman</>
                        ) : (
                          'Tindak Lanjut'
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 text-xs font-semibold px-4 rounded-full border-2",
                        isHigh ? 'border-rose-200 text-rose-700 hover:bg-rose-100' : isMedium ? 'border-amber-200 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={async () => {
                        setIsSubmitting(true);
                        try {
                          await completeTask(task.id);
                          refetch();
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Tandai Selesai
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
