import * as AWS from '@alchemy.run/aws';
import { RemovalPolicy } from 'alchemy';
import * as Effect from 'effect/Effect';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, matchesGlob, resolve, sep } from 'node:path';

export interface SiteFileRule {
  /** Globs relative to the build directory, e.g. `assets/**` or `**\/*.txt`. */
  files: string | string[];
  ignore?: string | string[];
  contentType?: string;
  cacheControl?: string;
}

export interface SiteFilesProps {
  /** An existing bucket. The stack writes its objects but never creates, changes or deletes the bucket. */
  bucketName: string;
  /** Build output, relative to the workspace root. */
  sourcePath: string;
  /**
   * Overrides for the defaults: content type from the extension; HTML never cached, everything else immutable.
   * The last matching rule wins outright, so a rule that sets a content type should also set the cache control.
   */
  rules?: SiteFileRule[];
}

/** Revalidate on every request: for files whose name does not change when their content does. */
export const REVALIDATE = 'public,max-age=0,must-revalidate';

/** Content types `AssetDeployment` does not infer, which our builds ship. Each one revalidates. */
export const EXTRA_CONTENT_TYPES: SiteFileRule[] = [
  { files: '**/*.pdf', contentType: 'application/pdf', cacheControl: REVALIDATE },
  { files: '**/*.eps', contentType: 'application/postscript', cacheControl: REVALIDATE },
  { files: '**/*.map', contentType: 'application/json', cacheControl: REVALIDATE },
];

/** Every file under `root` as a sorted POSIX path, or `undefined` when the directory is missing. */
export const listFiles = (root: string): string[] | undefined => {
  let names: string[];
  try {
    names = readdirSync(root, { recursive: true, encoding: 'utf8' });
  } catch {
    return undefined;
  }
  return names
    .filter((name) => statSync(join(root, name)).isFile())
    .map((name) => name.split(sep).join('/'))
    .sort();
};

/** SHA-256 over every file's path and content. */
export const hashFiles = (root: string, files: string[]): string => {
  const hash = createHash('sha256');
  for (const file of files) {
    hash
      .update(file)
      .update('\0')
      .update(readFileSync(join(root, file)))
      .update('\0');
  }
  return hash.digest('hex');
};

const matchesAny = (file: string, globs: string | string[] | undefined): boolean =>
  [globs ?? []].flat().some((glob) => matchesGlob(file, glob));

/**
 * Resolve each rule's globs to the exact files it covers. `AssetDeployment` (2.0.0-beta.87) turns `*` into an invalid
 * regular expression, so it only receives literal paths.
 */
export const expandRules = (files: string[], rules: SiteFileRule[]) =>
  rules.flatMap(({ files: globs, ignore, ...headers }) => {
    const matched = files.filter((file) => matchesAny(file, globs) && !matchesAny(file, ignore));
    return matched.length > 0 ? [{ files: matched, ...headers }] : [];
  });

/**
 * Upload a build directory to a website bucket: changed files only, stale files removed.
 *
 * `AssetDeployment` has no diff of its own, so the engine re-uploads only when its props change. The build's content
 * hash is part of the props, which makes a new build a change and an unchanged one a no-op.
 *
 * An empty or missing build stops the deploy: with `purge`, uploading nothing would empty the live site.
 */
export const SiteFiles = (id: string, props: SiteFilesProps) =>
  Effect.gen(function* () {
    const root = resolve(props.sourcePath);
    const files = listFiles(root) ?? [];
    if (files.length === 0) {
      return yield* Effect.die(new Error(`No build output in ${props.sourcePath}. Build the app before deploying it.`));
    }

    const deployment: AWS.Website.AssetDeploymentProps & { contentHash: string } = {
      bucket: { bucketName: props.bucketName },
      sourcePath: props.sourcePath,
      purge: true,
      fileOptions: expandRules(files, props.rules ?? []),
      contentHash: hashFiles(root, files),
    };
    // Retained: removing the stack or this resource leaves the live site in place.
    return yield* AWS.Website.AssetDeployment(id, deployment).pipe(RemovalPolicy.retain());
  });
