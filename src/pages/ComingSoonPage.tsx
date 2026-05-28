import { Clock } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: string;
}

export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-5">{icon}</div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold uppercase tracking-wider mb-5">
          <Clock size={11} /> Coming Soon
        </div>
        <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight mb-2">{title}</h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
