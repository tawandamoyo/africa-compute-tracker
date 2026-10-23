import { facilitiesCsv } from '../../lib/exports.js';

export function GET() {
  return new Response(facilitiesCsv(), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
