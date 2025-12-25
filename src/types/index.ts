export interface ParsedRequest {
  id: string;
  method: string;
  url: string;
  endpoint: string;
  body: unknown | null;
  timestamp: Date;
  lineNumber: number;
}

export interface ParsedResponse {
  id: string;
  statusCode: number;
  url: string;
  endpoint: string;
  body: unknown | null;
  timestamp: Date;
  lineNumber: number;
}

export interface ApiCall {
  id: string;
  method: string;
  url: string;
  endpoint: string;
  requestBody: unknown | null;
  responseBody: unknown | null;
  statusCode: number | null;
  timestamp: Date;
}

export interface EndpointGroup {
  endpoint: string;
  method: string;
  calls: ApiCall[];
  sampleRequest: unknown | null;
  sampleResponse: unknown | null;
}

export interface AnalysisResult {
  id: string;
  name: string;
  createdAt: Date;
  totalLines: number;
  apiRequests: number;
  uniqueEndpoints: number;
  junkFiltered: number;
  endpoints: EndpointGroup[];
  timeline: ApiCall[];
  rawLogs?: string;
}

export interface AnalysisStats {
  totalLines: number;
  apiRequests: number;
  uniqueEndpoints: number;
  junkFiltered: number;
}
