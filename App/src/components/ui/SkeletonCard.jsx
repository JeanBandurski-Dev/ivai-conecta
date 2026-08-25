export default function SkeletonCard({ type = 'job' }) {
  return (
    <div className="card gap-3.5 animate-pulse bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-1.5">
            <div className="w-24 h-3.5 bg-gray-200 dark:bg-slate-800 rounded" />
            <div className="w-16 h-2.5 bg-gray-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-14 h-5 rounded-full bg-gray-200 dark:bg-slate-800" />
      </div>

      <div className="w-3/4 h-5 bg-gray-200 dark:bg-slate-800 rounded my-1" />
      <div className="w-1/2 h-3 bg-gray-200 dark:bg-slate-800 rounded" />

      <div className="flex gap-1.5 pt-2">
        <div className="w-12 h-5 bg-gray-200 dark:bg-slate-800 rounded-full" />
        <div className="w-16 h-5 bg-gray-200 dark:bg-slate-800 rounded-full" />
        <div className="w-14 h-5 bg-gray-200 dark:bg-slate-800 rounded-full" />
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        <div className="w-full h-8 bg-gray-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
