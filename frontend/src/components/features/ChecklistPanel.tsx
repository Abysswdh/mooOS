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

function PriorityBadge({ priority }: { priority: ChecklistPriority }) {
  if (priority === 'HIGH') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">URGENT</span>;
  }
  if (priority === 'MEDIUM') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">NORMAL</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">INFO</span>;
}

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Analisis Sistem (MRP)</CardTitle>
            <CardDescription>Selesai: {completedCount} / {tasks.length}</CardDescription>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {pendingTasks.length} issue
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {pendingTasks.length === 0 ? (
          <EmptyState
            title="Semua tugas selesai!"
            description="Kandang sudah beres untuk shift ini."
          />
        ) : (
          <div className="divide-y">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-4 flex gap-4 hover:bg-muted/50 transition-colors">
                <button
                  className={cn(
                    "mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors",
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
                  <Circle className="w-6 h-6" />
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                    <PriorityBadge priority={task.priority as ChecklistPriority} />
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  
                  {task.action_type && task.action_type !== 'NONE' && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleAction(task.action_type, task.action_payload)}
                      >
                        {task.action_type === 'CREATE_PO' ? (
                          <><PlusCircle className="w-3 h-3 mr-1" /> Buat PO Pakan</>
                        ) : task.action_type === 'NAVIGATE' ? (
                          <><ExternalLink className="w-3 h-3 mr-1" /> Buka Halaman</>
                        ) : (
                          'Tindak Lanjut'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
