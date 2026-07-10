'use client';

import { useState } from 'react';

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Tugas Rutinitas Kandang
          </h2>
          <p className="text-sm text-slate-500 mt-1">Selesai: {completedCount} / {STATIC_TASKS.length}</p>
        </div>
        <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          {pendingTasks.length} tersisa
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${Math.round((completedCount / STATIC_TASKS.length) * 100)}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {pendingTasks.length === 0 ? (
          <EmptyState
            title="Semua tugas rutin selesai!"
            description="Kandang sudah beres untuk hari ini."
          />
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {pendingTasks.map((task, index) => (
              <div key={task.id} className="relative flex items-start gap-4 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                {/* Timeline line */}
                {index < pendingTasks.length - 1 && (
                  <div className="absolute left-[38px] top-12 bottom-[-24px] w-0.5 bg-slate-100" />
                )}
                
                <div className="pt-1 z-10">
                  <button
                    className="w-14 h-14 rounded-full border-2 border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center bg-white transition-all"
                    onClick={() => toggleTask(task.id)}
                  >
                    <Circle className="w-8 h-8" />
                  </button>
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-lg text-slate-800 leading-tight">{task.title}</h4>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      RUTIN
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
