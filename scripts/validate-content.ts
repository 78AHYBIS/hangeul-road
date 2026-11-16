/**
 * Checks every content file under src/content/. Run with: npm run validate:content
 *
 * Phase 0 rules (apply to every content type):
 *   - each .json file is an array of items
 *   - every item has a non-empty string `id`, unique across ALL content
 *   - any `korean` field is a non-empty string containing Hangul
 *   - `needsReview` items are counted and listed, never hidden
 *   - `lastVerified`, when present, is a YYYY-MM-DD date
 *   - `refs` (ids of other items), when present, all exist
 *   - items in the files listed in REQUIRED_FIELDS have those fields, non-empty
 *   - every `examples[]` entry has Hangul in `korean`
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTENT_TYPES = [
  'hangul',
  'vocab',
  'grammar',
  'phrases',
  'culture',
  'resources',
  'korea-apps',
] as const;

/** Fields each item must have, by file path ending. Add a line when you add a file. */
export const REQUIRED_FIELDS: Record<string, string[]> = {
  'hangul/letters.json': [
    'korean',
    'group',
    'name',
    'sound',
    'soundEn',
    'soundRu',
    'hint',
    'confusedWith',
    'speak',
  ],
  'hangul/lessons.json': ['group', 'title', 'intro'],
  'hangul/rules.json': ['title', 'summary', 'explanation', 'examples'],
  'hangul/reading-words.json': ['korean', 'romanization', 'meaning', 'category'],
};

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ContentFile {
  path: string;
  json: unknown;
}

export interface ValidationResult {
  errors: string[];
  needsReview: string[];
  itemCount: number;
}

export function validateContent(files: ContentFile[]): ValidationResult {
  const errors: string[] = [];
  const needsReview: string[] = [];
  const seenIds = new Map<string, string>();
  const refs: { from: string; to: string }[] = [];
  let itemCount = 0;

  for (const file of files) {
    if (!Array.isArray(file.json)) {
      errors.push(`${file.path}: file must contain a JSON array of items`);
      continue;
    }
    const normalizedPath = file.path.replaceAll('\\', '/');
    const required =
      Object.entries(REQUIRED_FIELDS).find(([ending]) => normalizedPath.endsWith(ending))?.[1] ??
      [];
    file.json.forEach((item: unknown, index: number) => {
      const where = `${file.path}[${index}]`;
      if (typeof item !== 'object' || item === null) {
        errors.push(`${where}: item must be an object`);
        return;
      }
      itemCount++;
      const record = item as Record<string, unknown>;
      const id = record.id;
      if (typeof id !== 'string' || id.trim() === '') {
        errors.push(`${where}: missing "id"`);
      } else if (seenIds.has(id)) {
        errors.push(`${where}: duplicate id "${id}" (also in ${seenIds.get(id)})`);
      } else {
        seenIds.set(id, where);
      }
      for (const field of required) {
        if (isEmpty(record[field])) errors.push(`${where}: missing "${field}"`);
      }
      if (Array.isArray(record.examples)) {
        record.examples.forEach((example: unknown, i: number) => {
          const korean = (example as Record<string, unknown> | null)?.korean;
          if (typeof korean !== 'string' || !HANGUL.test(korean)) {
            errors.push(`${where}.examples[${i}]: "korean" is missing or has no Hangul`);
          }
        });
      }
      if ('korean' in record) {
        const korean = record.korean;
        if (typeof korean !== 'string' || korean.trim() === '') {
          errors.push(`${where}: "korean" is empty`);
        } else if (!HANGUL.test(korean)) {
          errors.push(`${where}: "korean" contains no Hangul`);
        }
      }
      if ('lastVerified' in record && !ISO_DATE.test(String(record.lastVerified))) {
        errors.push(`${where}: "lastVerified" must be YYYY-MM-DD`);
      }
      if (record.needsReview === true) needsReview.push(`${where} (${String(id)})`);
      if (Array.isArray(record.refs)) {
        for (const ref of record.refs) refs.push({ from: where, to: String(ref) });
      }
    });
  }

  for (const ref of refs) {
    if (!seenIds.has(ref.to)) errors.push(`${ref.from}: broken reference "${ref.to}"`);
  }
  return { errors, needsReview, itemCount };
}

function loadFiles(contentDir: string): { files: ContentFile[]; errors: string[] } {
  const files: ContentFile[] = [];
  const errors: string[] = [];
  for (const type of CONTENT_TYPES) {
    const dir = join(contentDir, type);
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      errors.push(`missing content folder: src/content/${type}`);
      continue;
    }
    for (const name of names.filter((n) => n.endsWith('.json')).sort()) {
      const path = relative(process.cwd(), join(dir, name));
      try {
        files.push({ path, json: JSON.parse(readFileSync(join(dir, name), 'utf8')) });
      } catch (error) {
        errors.push(`${path}: invalid JSON (${(error as Error).message})`);
      }
    }
  }
  return { files, errors };
}

// Runs only when called from the command line, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const contentDir = join(process.cwd(), 'src', 'content');
  const loaded = loadFiles(contentDir);
  const result = validateContent(loaded.files);
  const errors = [...loaded.errors, ...result.errors];

  console.log(`Checked ${loaded.files.length} file(s), ${result.itemCount} item(s).`);
  if (result.needsReview.length > 0) {
    console.log(`\n${result.needsReview.length} item(s) marked needsReview:`);
    for (const line of result.needsReview) console.log(`  - ${line}`);
  }
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):`);
    for (const line of errors) console.error(`  - ${line}`);
    process.exit(1);
  }
  console.log('Content is valid.');
}
