'use client';

import { useState, useCallback } from 'react';
import { AnalysisResult } from '@/types';
import { createAnalysisResult } from '@/lib/log-parser';
import { saveAnalysis } from '@/lib/storage';
import { useToast } from '@/components/Toast';
import AnalysisTabs from '@/components/ui/AnalysisTabs';

const MAX_NAME_LENGTH = 100;
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

interface LogAnalyzerProps {
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

export default function LogAnalyzer({ onAnalysisComplete }: LogAnalyzerProps) {
  const [logs, setLogs] = useState('');
  const [analysisName, setAnalysisName] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showToast } = useToast();

  const handleNameChange = (value: string) => {
    // Limit name length
    if (value.length <= MAX_NAME_LENGTH) {
      setAnalysisName(value);
    }
  };

  const handleLogsChange = (value: string) => {
    // Check size limit
    if (value.length > MAX_LOG_SIZE) {
      showToast('Log content exceeds 10MB limit', 'error');
      return;
    }
    setLogs(value);
  };

  const handleAnalyze = useCallback(() => {
    if (!logs.trim()) return;

    setIsAnalyzing(true);

    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
      try {
        const name = analysisName.trim() || `Analysis ${new Date().toLocaleString()}`;
        const result = createAnalysisResult(name, logs);
        setAnalysis(result);

        try {
          saveAnalysis(result);
          showToast('Analysis saved successfully', 'success');
        } catch (e) {
          if (e instanceof Error && e.name === 'QuotaExceededError') {
            showToast('Storage full. Consider clearing old analyses.', 'error');
          } else {
            showToast('Failed to save analysis', 'error');
          }
        }

        onAnalysisComplete?.(result);
      } catch (e) {
        console.error('Analysis failed:', e);
        showToast('Failed to analyze logs', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    }, 50);
  }, [logs, analysisName, onAnalysisComplete, showToast]);

  const handleClear = () => {
    setLogs('');
    setAnalysisName('');
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="analysisName" className="block text-sm font-medium text-gray-300 mb-2">
            Analysis Name (optional)
            <span className="text-gray-500 ml-2">
              {analysisName.length}/{MAX_NAME_LENGTH}
            </span>
          </label>
          <input
            id="analysisName"
            type="text"
            value={analysisName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Login Flow, Patient List API"
            maxLength={MAX_NAME_LENGTH}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="text-xs text-gray-500 mt-1">
            Give your analysis a descriptive name for easy identification later
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="logs" className="block text-sm font-medium text-gray-300 mb-2">
            Paste Console Logs
            <span className="text-gray-500 ml-2">
              {(logs.length / 1024).toFixed(1)} KB
            </span>
          </label>
          <textarea
            id="logs"
            value={logs}
            onChange={(e) => handleLogsChange(e.target.value)}
            placeholder="Paste your iOS console logs here..."
            rows={12}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            aria-describedby="logs-hint"
          />
          <p id="logs-hint" className="text-xs text-gray-500 mt-1">
            Logs should contain API request/response markers (e.g., 📤 [REQUEST], 📥 [RESPONSE])
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!logs.trim() || isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-busy={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Logs'}
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-600 hover:bg-gray-500 text-white font-medium px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results Section */}
      {analysis && <AnalysisTabs analysis={analysis} />}
    </div>
  );
}
