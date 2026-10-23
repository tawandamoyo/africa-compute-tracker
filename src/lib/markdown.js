// Minimal, safe renderer for the free-text `notes` fields in facility YAML.
// Supports paragraphs (blank-line separated), **bold**, *italic*, `code` and [links](https://…).
// Single newlines are treated as soft wraps, since the YAML is hard-wrapped at ~100 columns.

const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

export function renderNotes(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map(p => `<p>${inline(p.replace(/\s*\n\s*/g, ' ').trim())}</p>`)
    .join('');
}

// Plain-text first sentence(s) of notes, for meta descriptions.
export function plainExcerpt(text, max = 155) {
  if (!text) return '';
  const plain = String(text).replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
