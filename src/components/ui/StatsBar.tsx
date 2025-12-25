interface StatsBarProps {
  totalLines: number;
  apiRequests: number;
  uniqueEndpoints: number;
  junkFiltered: number;
}

export default function StatsBar({
  totalLines,
  apiRequests,
  uniqueEndpoints,
  junkFiltered,
}: StatsBarProps) {
  return (
    <div
      className="grid grid-cols-4 gap-4 p-4 bg-gray-750 border-b border-gray-700"
      role="region"
      aria-label="Analysis statistics"
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{totalLines.toLocaleString()}</div>
        <div className="text-xs text-gray-400">Total Lines</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{apiRequests.toLocaleString()}</div>
        <div className="text-xs text-gray-400">API Requests</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">{uniqueEndpoints.toLocaleString()}</div>
        <div className="text-xs text-gray-400">Unique Endpoints</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">{junkFiltered.toLocaleString()}</div>
        <div className="text-xs text-gray-400">Junk Filtered</div>
      </div>
    </div>
  );
}
