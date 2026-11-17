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
 *   - grammar lessons have 4 to 6 examples and practice items that can be answered
 *     (one `___` gap, the answer among the options, tiles with Hangul)
 *   - phrase packs: every dialogue line and phrase has Hangul and a meaning; phrase ids
 *     are unique across all content, like item ids
 *   - culture cards: an existing topic, do / avoid lists, Korean words with meanings,
 *     https sources; a card that cites sources or states a date or phone number needs
 *     `lastVerified`; Ulsan / UNIST cards must cite at least one official source
 *   - culture topics: a quiz of 3+ questions, each with its answer among the options
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
  [
    /grammar\/lessons\.json$/,
    ['title', 'summary', 'pattern', 'explanation', 'examples', 'practice'],
  ],
  [/phrases\/packs\.json$/, ['title', 'situation', 'dialogue', 'phrases']],
  [/culture\/topics\.json$/, ['title', 'korean', 'intro', 'quiz']],
  [/culture\/cards\.json$/, ['topic', 'title', 'summary', 'body', 'do', 'avoid', 'words']],
];

/** Allowed values for resource fields (keep in sync with src/content/resources/index.ts). */
export const RESOURCE_ENUMS: Record<string, readonly string[]> = {
  type: ['course', 'youtube', 'website', 'app', 'podcast', 'book', 'dictionary', 'tutor'],
  level: ['beginner', 'beginner-intermediate', 'all'],
  cost: ['free', 'freemium', 'paid'],
  skills: ['hangul', 'vocabulary', 'grammar', 'listening', 'speaking', 'culture', 'topik'],
};
const STAGES = ['hangul', 'core', 'survival', 'arrival', 'in-korea'];
export const PRACTICE_TYPES = ['particle', 'blank', 'order', 'translate'];
const GAP = '___';

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
      if (/grammar\/lessons\.json$/.test(normalizedPath)) {
        checkGrammarLesson(record, where, errors);
      }
      if (/phrases\/packs\.json$/.test(normalizedPath)) {
        checkPhrasePack(record, where, errors, (phraseId, at) => {
          if (seenIds.has(phraseId)) {
            errors.push(`${at}: duplicate id "${phraseId}" (also in ${seenIds.get(phraseId)})`);
          } else {
            seenIds.set(phraseId, at);
          }
        });
      }
      if (/culture\/cards\.json$/.test(normalizedPath)) {
        checkCultureCard(record, where, errors);
        if (typeof record.topic === 'string') refs.push({ from: where, to: record.topic });
      }
      if (/culture\/topics\.json$/.test(normalizedPath)) {
        checkCultureTopic(record, where, errors);
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

const hasHangul = (v: unknown) => typeof v === 'string' && HANGUL.test(v);
const isText = (v: unknown) => typeof v === 'string' && v.trim() !== '';
const isTextList = (v: unknown, min: number) =>
  Array.isArray(v) && v.length >= min && v.every(isText);

/** Grammar rules: 4 to 6 examples, and practice items that have one right answer. */
function checkGrammarLesson(record: Record<string, unknown>, where: string, errors: string[]) {
  const examples = record.examples;
  if (Array.isArray(examples) && (examples.length < 4 || examples.length > 6)) {
    errors.push(`${where}: needs 4 to 6 examples (has ${examples.length})`);
  }
  if (Array.isArray(examples)) {
    examples.forEach((e: unknown, i: number) => {
      if (!isText((e as Record<string, unknown> | null)?.meaning)) {
        errors.push(`${where}.examples[${i}]: missing "meaning"`);
      }
    });
  }
  if (!Array.isArray(record.practice)) return;
  record.practice.forEach((raw: unknown, i: number) => {
    const at = `${where}.practice[${i}]`;
    const p = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    if (!PRACTICE_TYPES.includes(String(p.type))) {
      errors.push(`${at}: "type" must be one of ${PRACTICE_TYPES.join(', ')}`);
      return;
    }
    if (!isText(p.meaning)) errors.push(`${at}: missing "meaning"`);
    if (p.type === 'particle' || p.type === 'blank') {
      const korean = String(p.korean ?? '');
      if (!HANGUL.test(korean) || korean.split(GAP).length !== 2) {
        errors.push(`${at}: "korean" needs Hangul and exactly one ${GAP} gap`);
      }
      const options = p.options;
      if (
        !isTextList(options, 2) ||
        new Set(options as string[]).size !== (options as string[]).length
      ) {
        errors.push(`${at}: needs at least 2 different "options"`);
      } else if (!(options as string[]).includes(String(p.answer))) {
        errors.push(`${at}: "answer" is not one of the options`);
      }
    } else {
      if (!isTextList(p.tiles, 2) || !(p.tiles as unknown[]).every(hasHangul)) {
        errors.push(`${at}: needs at least 2 "tiles" with Hangul`);
      }
      if (p.type === 'translate') {
        if (!isTextList(p.distractors, 1)) {
          errors.push(`${at}: needs at least 1 "distractors" tile`);
        } else if ((p.distractors as string[]).some((d) => (p.tiles as string[]).includes(d))) {
          errors.push(`${at}: a distractor is also a correct tile`);
        }
      }
      if (p.accept !== undefined && !isTextList(p.accept, 1)) {
        errors.push(`${at}: "accept" must be a list of sentences`);
      }
    }
  });
}

/** Phrase pack rules: dialogue and phrases have Hangul and a meaning; phrase ids are unique. */
function checkPhrasePack(
  record: Record<string, unknown>,
  where: string,
  errors: string[],
  registerId: (id: string, at: string) => void,
) {
  const lines = Array.isArray(record.dialogue) ? record.dialogue : [];
  lines.forEach((raw: unknown, i: number) => {
    const line = (raw ?? {}) as Record<string, unknown>;
    if (!isText(line.speaker)) errors.push(`${where}.dialogue[${i}]: missing "speaker"`);
    if (!hasHangul(line.korean)) errors.push(`${where}.dialogue[${i}]: "korean" has no Hangul`);
    if (!isText(line.meaning)) errors.push(`${where}.dialogue[${i}]: missing "meaning"`);
  });
  const phrases = Array.isArray(record.phrases) ? record.phrases : [];
  if (phrases.length > 0 && phrases.length < 4) {
    errors.push(`${where}: needs at least 4 phrases for its quiz`);
  }
  phrases.forEach((raw: unknown, i: number) => {
    const at = `${where}.phrases[${i}]`;
    const phrase = (raw ?? {}) as Record<string, unknown>;
    if (!isText(phrase.id)) errors.push(`${at}: missing "id"`);
    else registerId(String(phrase.id), at);
    if (!hasHangul(phrase.korean)) errors.push(`${at}: "korean" has no Hangul`);
    if (!isText(phrase.meaning)) errors.push(`${at}: missing "meaning"`);
  });
}

/** Topic whose cards must cite an official source (spec: Ulsan / UNIST card footers). */
export const SOURCED_TOPIC = 'culture-topic-ulsan';
/** A year (2027) or an emergency / helpline number (112, 1330): facts that can change. */
const TIME_SENSITIVE = /\b20\d\d\b|\b1\d{2,3}\b/;

/** Culture card rules: lists of advice, Korean words, sources and verification dates. */
function checkCultureCard(record: Record<string, unknown>, where: string, errors: string[]) {
  for (const field of ['body', 'do', 'avoid']) {
    if (record[field] !== undefined && !isTextList(record[field], 1)) {
      errors.push(`${where}: "${field}" must be a list of text`);
    }
  }
  const words = Array.isArray(record.words) ? record.words : [];
  words.forEach((raw: unknown, i: number) => {
    const word = (raw ?? {}) as Record<string, unknown>;
    if (!hasHangul(word.korean)) errors.push(`${where}.words[${i}]: "korean" has no Hangul`);
    if (!isText(word.meaning)) errors.push(`${where}.words[${i}]: missing "meaning"`);
  });
  const sources = record.sources;
  if (sources !== undefined) {
    if (!Array.isArray(sources) || sources.length === 0) {
      errors.push(`${where}: "sources" must be a non-empty list`);
    } else {
      sources.forEach((raw: unknown, i: number) => {
        const source = (raw ?? {}) as Record<string, unknown>;
        if (!isText(source.name)) errors.push(`${where}.sources[${i}]: missing "name"`);
        if (typeof source.url !== 'string' || !/^https:\/\/[^\s]+$/.test(source.url)) {
          errors.push(`${where}.sources[${i}]: "url" must start with https://`);
        }
      });
    }
  }
  const text = [record.summary, ...(Array.isArray(record.body) ? record.body : [])].join(' ');
  if ((sources !== undefined || TIME_SENSITIVE.test(text)) && !('lastVerified' in record)) {
    errors.push(`${where}: cites sources or a date / number, so it needs "lastVerified"`);
  }
  if (record.topic === SOURCED_TOPIC && sources === undefined) {
    errors.push(`${where}: Ulsan and UNIST cards must cite an official source`);
  }
}

/** Culture topic rules: a quiz of 3+ questions with one listed answer each. */
function checkCultureTopic(record: Record<string, unknown>, where: string, errors: string[]) {
  const quiz = record.quiz;
  if (!Array.isArray(quiz)) return;
  if (quiz.length < 3) errors.push(`${where}: needs a quiz of at least 3 questions`);
  quiz.forEach((raw: unknown, i: number) => {
    const at = `${where}.quiz[${i}]`;
    const q = (raw ?? {}) as Record<string, unknown>;
    if (!isText(q.question)) errors.push(`${at}: missing "question"`);
    if (!isText(q.why)) errors.push(`${at}: missing "why"`);
    const options = q.options;
    if (
      !isTextList(options, 2) ||
      new Set(options as string[]).size !== (options as string[]).length
    ) {
      errors.push(`${at}: needs at least 2 different "options"`);
    } else if (!(options as string[]).includes(String(q.answer))) {
      errors.push(`${at}: "answer" is not one of the options`);
    }
  });
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
