'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAnalysisList, deleteAnalysis, clearAllAnalyses } from '@/lib/storage';
import { useToast } from '@/components/Toast';

interface AnalysisSummary {
  id: string;
  name: string;
  createdAt: string;
  totalLines: number;
  apiRequests: number;
  uniqueEndpoints: number;
  junkFiltered: number;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = () => {
    const list = getAnalysisList();
    setAnalyses(list);
    setIsLoading(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteAnalysis(id);
      loadAnalyses();
      showToast('Analysis deleted', 'success');
    }
  };

  const handleClearAll = () => {
    clearAllAnalyses();
    setAnalyses([]);
    setShowConfirmClear(false);
    showToast('All analyses cleared', 'success');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-gray-400">
            View and manage your past API log analyses. Click on an analysis to view details.
          </p>
        </div>
        {analyses.length > 0 && (
          <div>
            {showConfirmClear ? (
              <div className="flex items-center gap-2" role="alertdialog" aria-label="Confirm clear all">
                <span className="text-gray-400 text-sm">Are you sure?</span>
                <button
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">No analyses yet</div>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Analyze Logs
          </Link>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Analysis history">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
              role="listitem"
            >
              <div className="flex items-center justify-between">
                <Link href={`/history/${analysis.id}`} className="flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{analysis.name}</h3>
                      <time
                        dateTime={analysis.createdAt}
                        className="text-gray-500 text-sm"
                      >
                        {formatDate(analysis.createdAt)}
                      </time>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-medium">{analysis.apiRequests}</div>
                        <div className="text-gray-500 text-xs">Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-medium">{analysis.uniqueEndpoints}</div>
                        <div className="text-gray-500 text-xs">Endpoints</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 font-medium">{analysis.totalLines.toLocaleString()}</div>
                        <div className="text-gray-500 text-xs">Lines</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(analysis.id, analysis.name);
                  }}
                  className="ml-4 p-2 text-gray-500 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                  aria-label={`Delete ${analysis.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
