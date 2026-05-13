import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

function getFacilitiesDir() {
  return join(process.cwd(), 'data', 'facilities');
}

export function loadFacilities() {
  const dir = getFacilitiesDir();
  const files = readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  return files
    .map(file => yaml.load(readFileSync(join(dir, file), 'utf-8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadFacility(id) {
  return loadFacilities().find(f => f.id === id) ?? null;
}
