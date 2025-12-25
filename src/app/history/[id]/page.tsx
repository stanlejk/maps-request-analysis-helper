'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAnalysisById, deleteAnalysis } from '@/lib/storage';
import { AnalysisResult } from '@/types';
import { useToast } from '@/components/Toast';
import AnalysisTabs from '@/components/ui/AnalysisTabs';

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const result = getAnalysisById(id);
    setAnalysis(result);
    setIsLoading(false);
  }, [params.id]);

  const handleDelete = () => {
    if (analysis && confirm(`Delete "${analysis.name}"?`)) {
      deleteAnalysis(analysis.id);
      showToast('Analysis deleted', 'success');
      router.push('/history');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
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

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 mb-4">Analysis not found</div>
        <Link
          href="/history"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/history"
          className="text-gray-400 hover:text-white text-sm mb-2 inline-flex items-center gap-1 focus:outline-none focus:underline"
        >
          <span aria-hidden="true">←</span> Back to History
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{analysis.name}</h1>
            <p className="text-gray-500">
              <time dateTime={analysis.createdAt.toISOString()}>
                {formatDate(analysis.createdAt)}
              </time>
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={`Delete analysis: ${analysis.name}`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Results using shared component */}
      <AnalysisTabs analysis={analysis} />
    </div>
  );
}
