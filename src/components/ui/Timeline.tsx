'use client';

import { ApiCall } from '@/types';
import { generateCurlCommand } from '@/lib/curl-generator';
import { useToast } from '@/components/Toast';
import MethodBadge from './MethodBadge';

interface TimelineProps {
  calls: ApiCall[];
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  let colorClass: string;

  if (statusCode >= 200 && statusCode < 300) {
    colorClass = 'bg-green-900 text-green-300';
  } else if (statusCode >= 400) {
    colorClass = 'bg-red-900 text-red-300';
  } else {
    colorClass = 'bg-yellow-900 text-yellow-300';
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs ${colorClass}`}
      aria-label={`Status code: ${statusCode}`}
    >
      {statusCode}
    </span>
  );
}

export default function Timeline({ calls }: TimelineProps) {
  const { showToast } = useToast();

  const copyCurl = async (call: ApiCall) => {
    try {
      const curl = generateCurlCommand(call);
      await navigator.clipboard.writeText(curl);
      showToast('cURL command copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  if (calls.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No API calls found in the timeline.
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="API call timeline">
      {calls.map((call, index) => (
        <div
          key={call.id}
          className="bg-gray-750 rounded-lg px-4 py-3 flex items-center gap-4 group"
          role="listitem"
        >
          <span className="text-gray-500 text-sm font-mono w-8" aria-label={`Request number ${index + 1}`}>
            {index + 1}
          </span>
          <MethodBadge method={call.method} />
          {call.statusCode && <StatusBadge statusCode={call.statusCode} />}
          <span className="text-white font-mono text-sm truncate flex-1" title={call.endpoint}>
            {call.endpoint}
          </span>
          <button
            onClick={() => copyCurl(call)}
            className="px-2 py-1 text-gray-500 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
            title="Copy as cURL command"
            aria-label={`Copy request ${index + 1} as cURL command`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
