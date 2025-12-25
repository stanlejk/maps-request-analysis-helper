'use client';

import { useState } from 'react';
import { EndpointGroup } from '@/types';
import { generateCurlFromEndpoint } from '@/lib/curl-generator';
import { useToast } from '@/components/Toast';
import MethodBadge from './MethodBadge';

interface EndpointListProps {
  endpoints: EndpointGroup[];
}

export default function EndpointList({ endpoints }: EndpointListProps) {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const copyCurl = (endpoint: EndpointGroup) => {
    // Use the first call's URL for the curl command
    const url = endpoint.calls[0]?.url || endpoint.endpoint;
    const curl = generateCurlFromEndpoint(endpoint.method, url, endpoint.sampleRequest);
    copyToClipboard(curl, 'cURL command');
  };

  if (endpoints.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No API endpoints found in the logs.
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="API endpoints">
      {endpoints.map((endpoint) => {
        const key = `${endpoint.method} ${endpoint.endpoint}`;
        const isExpanded = expandedEndpoints.has(key);

        return (
          <div
            key={key}
            className="bg-gray-750 rounded-lg overflow-hidden"
            role="listitem"
          >
            <div className="flex items-center">
              <button
                onClick={() => toggleEndpoint(key)}
                className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors text-left"
                aria-expanded={isExpanded}
                aria-controls={`endpoint-details-${key.replace(/\s/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <MethodBadge method={endpoint.method} />
                  <span className="text-white font-mono text-sm">{endpoint.endpoint}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">{endpoint.calls.length} call(s)</span>
                  <span className="text-gray-500" aria-hidden="true">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => copyCurl(endpoint)}
                className="px-3 py-3 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-l border-gray-700"
                title="Copy as cURL command"
                aria-label={`Copy ${endpoint.method} ${endpoint.endpoint} as cURL command`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {isExpanded && (
              <div
                id={`endpoint-details-${key.replace(/\s/g, '-')}`}
                className="px-4 pb-4 space-y-3 border-t border-gray-700"
              >
                {endpoint.sampleRequest !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Sample Request Body:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(endpoint.sampleRequest, null, 2), 'Request body')}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        aria-label="Copy request body"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-900 p-3 rounded text-xs text-green-300 overflow-x-auto">
                      {JSON.stringify(endpoint.sampleRequest, null, 2)}
                    </pre>
                  </div>
                )}
                {endpoint.sampleResponse !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Sample Response Body:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(endpoint.sampleResponse, null, 2), 'Response body')}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        aria-label="Copy response body"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-900 p-3 rounded text-xs text-blue-300 overflow-x-auto">
                      {JSON.stringify(endpoint.sampleResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {/* cURL Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">cURL Command:</span>
                    <button
                      onClick={() => copyCurl(endpoint)}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      aria-label="Copy cURL command"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-900 p-3 rounded text-xs text-purple-300 overflow-x-auto">
                    {generateCurlFromEndpoint(
                      endpoint.method,
                      endpoint.calls[0]?.url || endpoint.endpoint,
                      endpoint.sampleRequest
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
