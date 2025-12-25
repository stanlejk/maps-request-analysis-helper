'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types';
import StatsBar from './StatsBar';
import EndpointList from './EndpointList';
import Timeline from './Timeline';
import TypeScriptCode from './TypeScriptCode';

type Tab = 'summary' | 'timeline' | 'typescript';

interface AnalysisTabsProps {
  analysis: AnalysisResult;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Endpoint Summary' },
  { id: 'timeline', label: 'Request Timeline' },
  { id: 'typescript', label: 'TypeScript Code' },
];

export default function AnalysisTabs({ analysis }: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <StatsBar
        totalLines={analysis.totalLines}
        apiRequests={analysis.apiRequests}
        uniqueEndpoints={analysis.uniqueEndpoints}
        junkFiltered={analysis.junkFiltered}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-700" role="tablist" aria-label="Analysis views">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div
          role="tabpanel"
          id="tabpanel-summary"
          aria-labelledby="tab-summary"
          hidden={activeTab !== 'summary'}
        >
          {activeTab === 'summary' && <EndpointList endpoints={analysis.endpoints} />}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-timeline"
          aria-labelledby="tab-timeline"
          hidden={activeTab !== 'timeline'}
        >
          {activeTab === 'timeline' && <Timeline calls={analysis.timeline} />}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-typescript"
          aria-labelledby="tab-typescript"
          hidden={activeTab !== 'typescript'}
        >
          {activeTab === 'typescript' && <TypeScriptCode endpoints={analysis.endpoints} />}
        </div>
      </div>
    </div>
  );
}
