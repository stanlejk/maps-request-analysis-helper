import { z } from 'zod';
import { AnalysisResult } from '@/types';

const STORAGE_KEY = 'maps-log-analyses';
const MAX_ANALYSES = 50;

// Zod schemas for validation
const ApiCallSchema = z.object({
  id: z.string(),
  method: z.string(),
  url: z.string(),
  endpoint: z.string(),
  requestBody: z.unknown().nullable(),
  responseBody: z.unknown().nullable(),
  statusCode: z.number().nullable(),
  timestamp: z.string().or(z.date()),
});

const EndpointGroupSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  calls: z.array(ApiCallSchema),
  sampleRequest: z.unknown().nullable(),
  sampleResponse: z.unknown().nullable(),
});

const StoredAnalysisSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  totalLines: z.number(),
  apiRequests: z.number(),
  uniqueEndpoints: z.number(),
  junkFiltered: z.number(),
  data: z.string(),
});

const StoredAnalysisArraySchema = z.array(StoredAnalysisSchema);

const AnalysisDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  totalLines: z.number(),
  apiRequests: z.number(),
  uniqueEndpoints: z.number(),
  junkFiltered: z.number(),
  endpoints: z.array(EndpointGroupSchema),
  timeline: z.array(ApiCallSchema),
});

export interface StoredAnalysis {
  id: string;
  name: string;
  createdAt: string;
  totalLines: number;
  apiRequests: number;
  uniqueEndpoints: number;
  junkFiltered: number;
  data: string;
}

function getStoredAnalyses(): StoredAnalysis[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    const validated = StoredAnalysisArraySchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('Invalid data in localStorage, clearing:', validated.error);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return validated.data;
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
    return [];
  }
}

function setStoredAnalyses(analyses: StoredAnalysis[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Consider clearing old analyses.');
    }
    console.error('Failed to save analyses to localStorage:', e);
    throw e; // Re-throw so caller can handle
  }
}

export function saveAnalysis(analysis: AnalysisResult): void {
  const analyses = getStoredAnalyses();

  // Create stored version without rawLogs to save space
  const analysisData = {
    id: analysis.id,
    name: analysis.name,
    createdAt: analysis.createdAt.toISOString(),
    totalLines: analysis.totalLines,
    apiRequests: analysis.apiRequests,
    uniqueEndpoints: analysis.uniqueEndpoints,
    junkFiltered: analysis.junkFiltered,
    endpoints: analysis.endpoints,
    timeline: analysis.timeline,
  };

  const storedAnalysis: StoredAnalysis = {
    id: analysis.id,
    name: analysis.name,
    createdAt: analysis.createdAt.toISOString(),
    totalLines: analysis.totalLines,
    apiRequests: analysis.apiRequests,
    uniqueEndpoints: analysis.uniqueEndpoints,
    junkFiltered: analysis.junkFiltered,
    data: JSON.stringify(analysisData),
  };

  // Add to beginning (most recent first)
  analyses.unshift(storedAnalysis);

  // Keep only last MAX_ANALYSES
  const trimmedAnalyses = analyses.slice(0, MAX_ANALYSES);

  setStoredAnalyses(trimmedAnalyses);
}

export function getAnalysisList(): Omit<StoredAnalysis, 'data'>[] {
  return getStoredAnalyses().map(({ id, name, createdAt, totalLines, apiRequests, uniqueEndpoints, junkFiltered }) => ({
    id,
    name,
    createdAt,
    totalLines,
    apiRequests,
    uniqueEndpoints,
    junkFiltered,
  }));
}

export function getAnalysisById(id: string): AnalysisResult | null {
  const analyses = getStoredAnalyses();
  const found = analyses.find(a => a.id === id);

  if (!found) return null;

  try {
    const parsed = JSON.parse(found.data);
    const validated = AnalysisDataSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('Invalid analysis data:', validated.error);
      return null;
    }

    // Convert all timestamp strings to Date objects
    const convertCall = (call: typeof validated.data.timeline[0]) => ({
      ...call,
      timestamp: new Date(call.timestamp),
    });

    return {
      ...validated.data,
      createdAt: new Date(validated.data.createdAt),
      timeline: validated.data.timeline.map(convertCall),
      endpoints: validated.data.endpoints.map(endpoint => ({
        ...endpoint,
        calls: endpoint.calls.map(convertCall),
      })),
    };
  } catch (e) {
    console.error('Failed to parse analysis data:', e);
    return null;
  }
}

export function deleteAnalysis(id: string): void {
  const analyses = getStoredAnalyses();
  const filtered = analyses.filter(a => a.id !== id);
  setStoredAnalyses(filtered);
}

export function clearAllAnalyses(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
