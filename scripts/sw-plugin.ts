/**
 * Vite plugin: writes dist/sw.js at build time from scripts/service-worker.js, with the
 * list of files to cache for offline use and a version hash. No Workbox needed.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

/** Big files the app does not need offline: iOS reads splash screens only when installing. */
const SKIP = [/^icons\/splash-/, /\.map$/, /^sw\.js$/];

function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path, root) : [relative(root, path)];
  });
}

export function serviceWorker(): Plugin {
  let publicDir = '';
  return {
    name: 'hangeul-road-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const files = new Map<string, string | Uint8Array>();
      for (const item of Object.values(bundle)) {
        files.set(item.fileName, item.type === 'chunk' ? item.code : item.source);
      }
      for (const name of listFiles(publicDir)) {
        files.set(name.split('\\').join('/'), readFileSync(join(publicDir, name)));
      }
      const precache = [...files.keys()].filter((f) => !SKIP.some((re) => re.test(f))).sort();
      for (const name of precache) {
        hash.update(name);
        hash.update(files.get(name)!);
      }
      const version = hash.digest('hex').slice(0, 12);
      const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source:
          `const PRECACHE = ${JSON.stringify(precache)};\n` +
          `const VERSION = '${version}';\n` +
          template,
      });
    },
  };
}
