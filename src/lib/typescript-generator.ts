import { EndpointGroup } from '@/types';

/**
 * Checks if a string is a valid TypeScript identifier.
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Sanitizes a property name for TypeScript.
 * Wraps invalid identifiers in quotes.
 */
function sanitizePropertyName(name: string): string {
  if (isValidIdentifier(name)) {
    return name;
  }
  // Escape quotes in the name and wrap in quotes
  const escaped = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toTypeName(endpoint: string): string {
  // Convert /api/users/123/profile to UsersProfile
  const parts = endpoint
    .split('/')
    .filter(p => p && !p.match(/^\d+$/) && p !== 'api')
    .map(p => capitalizeFirst(p.replace(/[^a-zA-Z0-9]/g, '')));

  return parts.join('') || 'Unknown';
}

function toFunctionName(method: string, endpoint: string): string {
  const typeName = toTypeName(endpoint);

  switch (method) {
    case 'GET':
      return `fetch${typeName}`;
    case 'POST':
      return `create${typeName}`;
    case 'PUT':
      return `update${typeName}`;
    case 'PATCH':
      return `patch${typeName}`;
    case 'DELETE':
      return `delete${typeName}`;
    default:
      return `${method.toLowerCase()}${typeName}`;
  }
}

function inferTypeFromValue(value: unknown, depth = 0): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    // Infer from first element
    return `${inferTypeFromValue(value[0], depth + 1)}[]`;
  }

  if (type === 'object') {
    if (depth > 2) return 'Record<string, unknown>';

    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);

    if (entries.length === 0) return 'Record<string, unknown>';

    const props = entries
      .map(([key, val]) => {
        const propName = sanitizePropertyName(key);
        const propType = inferTypeFromValue(val, depth + 1);
        return `  ${propName}: ${propType};`;
      })
      .join('\n');

    return `{\n${props}\n}`;
  }

  return 'unknown';
}

function generateInterface(name: string, sample: unknown): string {
  if (!sample || typeof sample !== 'object') {
    return `// Could not generate interface for ${name} - no sample data`;
  }

  const obj = sample as Record<string, unknown>;
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return `export interface ${name} {\n  [key: string]: unknown;\n}`;
  }

  const props = entries
    .map(([key, val]) => {
      const propName = sanitizePropertyName(key);
      const propType = inferTypeFromValue(val);
      return `  ${propName}: ${propType};`;
    })
    .join('\n');

  return `export interface ${name} {\n${props}\n}`;
}

export function generateTypeScriptCode(endpoints: EndpointGroup[]): string {
  const sections: string[] = [];
  const usedTypeNames = new Map<string, number>();
  const usedFunctionNames = new Map<string, number>();

  /**
   * Gets a unique type name, appending a number if collision detected.
   */
  function getUniqueTypeName(baseName: string): string {
    const count = usedTypeNames.get(baseName) || 0;
    usedTypeNames.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count + 1}`;
  }

  /**
   * Gets a unique function name, appending a number if collision detected.
   */
  function getUniqueFunctionName(baseName: string): string {
    const count = usedFunctionNames.get(baseName) || 0;
    usedFunctionNames.set(baseName, count + 1);
    return count === 0 ? baseName : `${baseName}${count + 1}`;
  }

  // Header
  sections.push(`// Auto-generated TypeScript API Client
// Generated on ${new Date().toISOString()}
// Total endpoints: ${endpoints.length}

import { mapsApiClient } from '@/src/api/mapsApiClient';
`);

  // Generate interfaces and functions for each endpoint
  for (const endpoint of endpoints) {
    const baseTypeName = toTypeName(endpoint.endpoint);
    const typeName = getUniqueTypeName(baseTypeName);
    const baseFunctionName = toFunctionName(endpoint.method, endpoint.endpoint);
    const functionName = getUniqueFunctionName(baseFunctionName);

    sections.push(`// =============================================================================`);
    sections.push(`// ${endpoint.method} ${endpoint.endpoint}`);
    sections.push(`// Called ${endpoint.calls.length} time(s)`);
    sections.push(`// =============================================================================\n`);

    // Request interface
    if (endpoint.sampleRequest) {
      sections.push(generateInterface(`${typeName}Request`, endpoint.sampleRequest));
      sections.push('');
    }

    // Response interface
    if (endpoint.sampleResponse) {
      sections.push(generateInterface(`${typeName}Response`, endpoint.sampleResponse));
      sections.push('');
    }

    // API function
    const hasRequest = endpoint.sampleRequest !== null;
    const hasResponse = endpoint.sampleResponse !== null;
    const requestType = hasRequest ? `${typeName}Request` : 'void';
    const responseType = hasResponse ? `${typeName}Response` : 'void';

    let functionBody: string;

    if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
      functionBody = `export async function ${functionName}(): Promise<${responseType}> {
  const response = await mapsApiClient.authenticatedRequest({
    method: '${endpoint.method}',
    url: '${endpoint.endpoint}',
  });
  return response${hasResponse ? ' as ' + responseType : ''};
}`;
    } else {
      const paramName = hasRequest ? 'data' : '';
      const paramType = hasRequest ? `: ${requestType}` : '';

      functionBody = `export async function ${functionName}(${paramName}${paramType}): Promise<${responseType}> {
  const response = await mapsApiClient.authenticatedRequest({
    method: '${endpoint.method}',
    url: '${endpoint.endpoint}',${hasRequest ? '\n    data,' : ''}
  });
  return response${hasResponse ? ' as ' + responseType : ''};
}`;
    }

    sections.push(functionBody);
    sections.push('\n');
  }

  return sections.join('\n');
}
