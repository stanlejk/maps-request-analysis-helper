interface MethodBadgeProps {
  method: string;
  className?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-600',
  POST: 'bg-blue-600',
  PUT: 'bg-yellow-600',
  PATCH: 'bg-orange-600',
  DELETE: 'bg-red-600',
};

export default function MethodBadge({ method, className = '' }: MethodBadgeProps) {
  const colorClass = METHOD_COLORS[method] || 'bg-gray-600';

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-bold text-white ${colorClass} ${className}`}
      aria-label={`HTTP method: ${method}`}
    >
      {method}
    </span>
  );
}
