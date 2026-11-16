/**
 * Thin wrapper around IndexedDB (through Dexie). The rest of the app only uses
 * the functions exported here, never Dexie directly.
 */
import Dexie, { type Table } from 'dexie';
import { APP_ID, SCHEMA_VERSION, migrate, type StoredData } from './schema';

interface KVRow {
  key: string;
  value: unknown;
}

const META_KEY = '__meta';

class AppDatabase extends Dexie {
  kv!: Table<KVRow, string>;

  constructor() {
    super(APP_ID);
    // This is the IndexedDB table layout version, not the data SCHEMA_VERSION.
    this.version(1).stores({ kv: 'key' });
  }
}

const db = new AppDatabase();

export async function getValue(key: string): Promise<unknown> {
  return (await db.kv.get(key))?.value;
}

export async function setValue(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}

/** Reads everything the app has saved (without the internal meta row). */
export async function readAll(): Promise<StoredData> {
  const rows = await db.kv.toArray();
  const data: StoredData = {};
  for (const row of rows) {
    if (row.key !== META_KEY) data[row.key] = row.value;
  }
  return data;
}

/** Replaces everything saved with `data`, in one transaction (all or nothing). */
export async function replaceAll(data: StoredData): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    await db.kv.clear();
    await db.kv.bulkPut([
      ...Object.entries(data).map(([key, value]) => ({ key, value })),
      { key: META_KEY, value: { schemaVersion: SCHEMA_VERSION } },
    ]);
  });
}

/** Runs once at startup: upgrades data saved by an older version of the app. */
export async function ensureCurrentSchema(): Promise<void> {
  const meta = (await db.kv.get(META_KEY))?.value as { schemaVersion?: number } | undefined;
  const saved = meta?.schemaVersion;
  if (saved === SCHEMA_VERSION) return;
  if (typeof saved === 'number' && saved < SCHEMA_VERSION) {
    await replaceAll(migrate(await readAll(), saved));
  } else {
    await db.kv.put({ key: META_KEY, value: { schemaVersion: SCHEMA_VERSION } });
  }
}
