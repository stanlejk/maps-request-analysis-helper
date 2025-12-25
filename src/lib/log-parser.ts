import { ApiCall, EndpointGroup, AnalysisResult, AnalysisStats } from '@/types';

// Junk patterns to filter out
const JUNK_PATTERNS: RegExp[] = [
  /^jgjdf\s*>/,
  /BaseViewController/,
  /Badge\s*>\s*setBadgeInAppIcon/,
  /nw_socket_set_connection_idle/,
  /FirestoreManager/,
  /^"Access token::/,
  /collectionView\(_:/,
  /addPatientBtnTopConstraints/,
  /^\s*Optional\(/,
  /^\s*nil$/,
  /^\s*\d+(\.\d+)?$/,
  /^\s*true$/i,
  /^\s*false$/i,
  /^qwerty/i,
  /^zzzz/i,
  /^asdf/i,
  /^1234567890$/,
  /^test\d*$/i,
  /^\s*\[\s*\]$/,
  /^\s*\{\s*\}$/,
  /didSelectItemAt/,
  /numberOfItemsInSection/,
  /cellForItemAt/,
  /sizeForItemAt/,
  /viewWillAppear/,
  /viewDidLoad/,
  /viewDidAppear/,
  /viewWillDisappear/,
  /viewDidDisappear/,
  /deinit/,
  /^\s*-+\s*$/,
  /^\s*=+\s*$/,
  /^Connection \d+:/,
  /^TIC /,
  /^Task <[^>]+>/,
  /^\[BoringSSL\]/,
  /^nw_protocol_get_quic_image/,
  /^MAPS\[\d+:\d+\]/,
  /^Metal API Validation/,
  /^GPU Frame Capture/,
  /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+[+-]\d+\s+MAPS\[/,
  /^setting clinic!/,
  /^loading clinic/i,
  /^clinic loaded/i,
  /^user logged in/i,
  /^user logged out/i,
  /refreshData/i,
  /^token refreshed/i,
  /^auth state changed/i,
  /^navigation to/i,
  /^\s*print\(/,
  /^\s*debugPrint\(/,
  /NSLog/,
];

function isJunkLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < 3) return true;
  return JUNK_PATTERNS.some(pattern => pattern.test(trimmed));
}

function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/https?:\/\/[^\/]+(\/[^\s?]*)/);
    return match ? match[1] : url;
  }
}

function parseRequestLine(line: string): { method: string; url: string } | null {
  const match = line.match(/📤\s*\[REQUEST\]\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)/);
  if (match) {
    return { method: match[1], url: match[2].trim() };
  }
  return null;
}

function parseResponseLine(line: string): { statusCode: number; url: string } | null {
  const match = line.match(/📥\s*\[RESPONSE\]\s*(\d+)\s+(.+)/);
  if (match) {
    return { statusCode: parseInt(match[1], 10), url: match[2].trim() };
  }
  return null;
}

function parseBodyLine(line: string): string | null {
  // Match both request and response body lines
  const match = line.match(/📤\s*\[REQUEST\]\s*Body:\s*(.+)|📥\s*\[RESPONSE\]\s*Body:\s*(.+)/);
  if (match) {
    return match[1] || match[2];
  }
  return null;
}

function tryParseJson(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function generateId(): string {
  // Use crypto.randomUUID for secure, unique IDs
  // Falls back to Math.random for environments without crypto
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function isValidApiCall(request: Partial<ApiCall>): request is ApiCall {
  return (
    typeof request.id === 'string' &&
    typeof request.method === 'string' &&
    typeof request.url === 'string' &&
    typeof request.endpoint === 'string' &&
    request.timestamp instanceof Date
  );
}

export function parseLogContent(content: string): {
  stats: AnalysisStats;
  endpoints: EndpointGroup[];
  timeline: ApiCall[];
} {
  const lines = content.split('\n');
  const apiCalls: ApiCall[] = [];
  let junkCount = 0;
  let currentRequest: Partial<ApiCall> | null = null;
  let isCollectingRequestBody = false;
  let isCollectingResponseBody = false;
  let bodyBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for request start
    const requestMatch = parseRequestLine(trimmedLine);
    if (requestMatch) {
      // Save previous request if exists and is valid
      if (currentRequest && isValidApiCall(currentRequest)) {
        apiCalls.push(currentRequest);
      }

      currentRequest = {
        id: generateId(),
        method: requestMatch.method,
        url: requestMatch.url,
        endpoint: extractEndpoint(requestMatch.url),
        requestBody: null,
        responseBody: null,
        statusCode: null,
        timestamp: new Date(),
      };
      isCollectingRequestBody = false;
      isCollectingResponseBody = false;
      bodyBuffer = '';
      continue;
    }

    // Check for request body
    if (trimmedLine.includes('📤') && trimmedLine.includes('[REQUEST]') && trimmedLine.includes('Body:')) {
      const bodyContent = parseBodyLine(trimmedLine);
      if (bodyContent && currentRequest) {
        const parsed = tryParseJson(bodyContent);
        if (parsed) {
          currentRequest.requestBody = parsed;
        } else {
          // Start collecting multi-line body
          isCollectingRequestBody = true;
          isCollectingResponseBody = false;
          bodyBuffer = bodyContent;
        }
      }
      continue;
    }

    // Check for response start
    const responseMatch = parseResponseLine(trimmedLine);
    if (responseMatch && currentRequest) {
      currentRequest.statusCode = responseMatch.statusCode;
      isCollectingRequestBody = false;
      isCollectingResponseBody = false;

      // Try to parse any buffered request body
      if (bodyBuffer) {
        const parsed = tryParseJson(bodyBuffer);
        if (parsed) {
          currentRequest.requestBody = parsed;
        }
        bodyBuffer = '';
      }
      continue;
    }

    // Check for response body
    if (trimmedLine.includes('📥') && trimmedLine.includes('[RESPONSE]') && trimmedLine.includes('Body:')) {
      const bodyContent = parseBodyLine(trimmedLine);
      if (bodyContent && currentRequest) {
        const parsed = tryParseJson(bodyContent);
        if (parsed) {
          currentRequest.responseBody = parsed;
        } else {
          // Start collecting multi-line body
          isCollectingResponseBody = true;
          isCollectingRequestBody = false;
          bodyBuffer = bodyContent;
        }
      }
      continue;
    }

    // Collect multi-line body content
    if ((isCollectingRequestBody || isCollectingResponseBody) && trimmedLine) {
      // Check if this looks like JSON continuation
      if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[') ||
          trimmedLine.startsWith('"') || trimmedLine.match(/^[\}\]\,\:]/)) {
        bodyBuffer += trimmedLine;

        // Try to parse completed JSON
        const parsed = tryParseJson(bodyBuffer);
        if (parsed) {
          if (isCollectingRequestBody && currentRequest) {
            currentRequest.requestBody = parsed;
          } else if (isCollectingResponseBody && currentRequest) {
            currentRequest.responseBody = parsed;
          }
          bodyBuffer = '';
          isCollectingRequestBody = false;
          isCollectingResponseBody = false;
        }
      } else {
        // Non-JSON line, stop collecting
        isCollectingRequestBody = false;
        isCollectingResponseBody = false;
        bodyBuffer = '';
      }
    }

    // Count junk lines (not API-related)
    if (!trimmedLine.includes('📤') && !trimmedLine.includes('📥')) {
      if (isJunkLine(line)) {
        junkCount++;
      }
    }
  }

  // Don't forget the last request
  if (currentRequest && isValidApiCall(currentRequest)) {
    apiCalls.push(currentRequest);
  }

  // Group by endpoint
  const endpointMap = new Map<string, EndpointGroup>();

  for (const call of apiCalls) {
    const key = `${call.method} ${call.endpoint}`;

    if (!endpointMap.has(key)) {
      endpointMap.set(key, {
        endpoint: call.endpoint,
        method: call.method,
        calls: [],
        sampleRequest: null,
        sampleResponse: null,
      });
    }

    const group = endpointMap.get(key)!;
    group.calls.push(call);

    // Update sample request/response with first non-null values
    if (!group.sampleRequest && call.requestBody) {
      group.sampleRequest = call.requestBody;
    }
    if (!group.sampleResponse && call.responseBody) {
      group.sampleResponse = call.responseBody;
    }
  }

  const endpoints = Array.from(endpointMap.values()).sort((a, b) =>
    b.calls.length - a.calls.length
  );

  return {
    stats: {
      totalLines: lines.length,
      apiRequests: apiCalls.length,
      uniqueEndpoints: endpoints.length,
      junkFiltered: junkCount,
    },
    endpoints,
    timeline: apiCalls,
  };
}

export function createAnalysisResult(
  name: string,
  content: string
): AnalysisResult {
  const { stats, endpoints, timeline } = parseLogContent(content);

  return {
    id: generateId(),
    name,
    createdAt: new Date(),
    totalLines: stats.totalLines,
    apiRequests: stats.apiRequests,
    uniqueEndpoints: stats.uniqueEndpoints,
    junkFiltered: stats.junkFiltered,
    endpoints,
    timeline,
    rawLogs: content,
  };
}
