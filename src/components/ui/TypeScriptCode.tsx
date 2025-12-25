'use client';

import { EndpointGroup } from '@/types';
import { generateTypeScriptCode } from '@/lib/typescript-generator';
import { useToast } from '@/components/Toast';

interface TypeScriptCodeProps {
  endpoints: EndpointGroup[];
}

export default function TypeScriptCode({ endpoints }: TypeScriptCodeProps) {
  const { showToast } = useToast();
  const code = generateTypeScriptCode(endpoints);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('TypeScript code copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={copyToClipboard}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          aria-label="Copy TypeScript code to clipboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy to Clipboard
        </button>
      </div>
      <pre
        className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap"
        tabIndex={0}
        aria-label="Generated TypeScript code"
      >
        {code}
      </pre>
    </div>
  );
}
