export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
      <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <span>{label}</span>
    </div>
  );
}
