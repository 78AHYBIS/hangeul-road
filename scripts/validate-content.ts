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
 *   - `example` contains Hangul, and `deck` points to an existing deck id
 *   - every `examples[]` entry has Hangul in `korean`
 *   - resources use known type / level / cost / skills, an https URL and `lastVerified`;
 *     path steps use a known roadmap stage and `refs` to existing resources
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

/** Fields each item must have, by file path. Add a line when you add a kind of file. */
export const REQUIRED_FIELDS: [RegExp, string[]][] = [
  [
    /hangul\/letters\.json$/,
    ['korean', 'group', 'name', 'sound', 'soundEn', 'soundRu', 'hint', 'confusedWith', 'speak'],
  ],
  [/hangul\/lessons\.json$/, ['group', 'title', 'intro']],
  [/hangul\/rules\.json$/, ['title', 'summary', 'explanation', 'examples']],
  [/hangul\/reading-words\.json$/, ['korean', 'romanization', 'meaning', 'category']],
  [/vocab\/decks\.json$/, ['title', 'description']],
  [/vocab\/deck-[^/]+\.json$/, ['korean', 'meaning', 'pos', 'deck', 'example', 'exampleMeaning']],
  [
    /resources\/resources\.json$/,
    ['name', 'type', 'url', 'description', 'why', 'skills', 'level', 'cost', 'lastVerified'],
  ],
  [/resources\/path\.json$/, ['stage', 'title', 'text', 'refs']],
];

/** Allowed values for resource fields (keep in sync with src/content/resources/index.ts). */
export const RESOURCE_ENUMS: Record<string, readonly string[]> = {
  type: ['course', 'youtube', 'website', 'app', 'podcast', 'book', 'dictionary', 'tutor'],
  level: ['beginner', 'beginner-intermediate', 'all'],
  cost: ['free', 'freemium', 'paid'],
  skills: ['hangul', 'vocabulary', 'grammar', 'listening', 'speaking', 'culture', 'topik'],
};
const STAGES = ['hangul', 'core', 'survival', 'arrival', 'in-korea'];

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
    const required = REQUIRED_FIELDS.find(([pattern]) => pattern.test(normalizedPath))?.[1] ?? [];
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
      // An example sentence must be Korean, and a word's deck must exist.
      if (typeof record.example === 'string' && !HANGUL.test(record.example)) {
        errors.push(`${where}: "example" has no Hangul`);
      }
      if (typeof record.deck === 'string') refs.push({ from: where, to: record.deck });
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
      if (/resources\/resources\.json$/.test(normalizedPath)) {
        checkResource(record, where, errors);
      }
      if (/resources\/path\.json$/.test(normalizedPath) && !STAGES.includes(String(record.stage))) {
        errors.push(`${where}: "stage" must be one of ${STAGES.join(', ')}`);
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

/** Resource rules: known type/level/cost/skills, an https link, a verification date. */
function checkResource(record: Record<string, unknown>, where: string, errors: string[]) {
  for (const [field, allowed] of Object.entries(RESOURCE_ENUMS)) {
    const value = record[field];
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (!allowed.includes(String(v))) errors.push(`${where}: unknown ${field} "${String(v)}"`);
    }
  }
  if (typeof record.url === 'string' && !/^https:\/\/[^\s]+$/.test(record.url)) {
    errors.push(`${where}: "url" must start with https://`);
  }
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
