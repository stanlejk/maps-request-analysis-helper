import { ApiCall } from '@/types';

/**
 * Escapes a string for safe use in a shell single-quoted context.
 * Single quotes are replaced with: '\''
 * This closes the quote, adds an escaped quote, and reopens the quote.
 */
function escapeForShell(str: string): string {
  return str.replace(/'/g, "'\\''");
}

/**
 * Generates a cURL command from an API call.
 */
export function generateCurlCommand(call: ApiCall): string {
  const parts: string[] = ['curl'];

  // Add method (GET is default, so only add for others)
  if (call.method !== 'GET') {
    parts.push(`-X ${call.method}`);
  }

  // Add headers
  parts.push("-H 'Content-Type: application/json'");
  parts.push("-H 'Accept: application/json'");

  // Add request body for POST/PUT/PATCH
  if (call.requestBody && ['POST', 'PUT', 'PATCH'].includes(call.method)) {
    const bodyJson = JSON.stringify(call.requestBody);
    const escapedBody = escapeForShell(bodyJson);
    parts.push(`-d '${escapedBody}'`);
  }

  // Add URL - escape for shell safety
  const escapedUrl = escapeForShell(call.url);
  parts.push(`'${escapedUrl}'`);

  return parts.join(' \\\n  ');
}

/**
 * Generates a cURL command from endpoint details.
 */
export function generateCurlFromEndpoint(
  method: string,
  url: string,
  requestBody: unknown | null
): string {
  const parts: string[] = ['curl'];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  parts.push("-H 'Content-Type: application/json'");
  parts.push("-H 'Accept: application/json'");

  if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
    const bodyJson = JSON.stringify(requestBody);
    const escapedBody = escapeForShell(bodyJson);
    parts.push(`-d '${escapedBody}'`);
  }

  // Add URL - escape for shell safety
  const escapedUrl = escapeForShell(url);
  parts.push(`'${escapedUrl}'`);

  return parts.join(' \\\n  ');
}
