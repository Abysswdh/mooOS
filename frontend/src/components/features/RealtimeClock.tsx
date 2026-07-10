'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center">
      {/* Example format: Kamis, 10/07/26 02:15:30 */}
      {format(time, "EEEE, dd/MM/yy HH:mm:ss", { locale: idLocale })}
    </div>
  );
}
