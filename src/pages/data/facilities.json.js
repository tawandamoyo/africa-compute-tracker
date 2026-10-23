import { facilitiesJson } from '../../lib/exports.js';

export function GET() {
  return new Response(facilitiesJson(), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
