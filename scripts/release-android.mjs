#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(import.meta.url), '../..');
const androidDir = join(appDir, 'android');
const androidVersionFile = join(androidDir, 'version');

const options = parseOptions(process.argv.slice(2));

if (options.help || !options.version) {
  printHelp();
  process.exit(options.help ? 0 : 1);
}

const version = String(options.version).trim();
const versionCode = toAndroidVersionCode(version);
const buildType = options.debug ? 'debug' : 'release';
const gradleTask = options.debug ? 'assembleDebug' : 'assembleRelease';
const appVersion = options.debug ? `${version}-debug` : version;

mkdirSync(androidDir, { recursive: true });
writeFileSync(androidVersionFile, `versionCode ${versionCode}\nversionName ${version}\n`, 'utf8');

console.log(`Android versionCode=${versionCode}, versionName=${version}, buildType=${buildType}`);

run('pnpm', ['build'], {
  cwd: appDir,
  env: { ...process.env, ISLET_APP_VERSION: appVersion },
});
run('pnpm', ['android:sync'], { cwd: appDir });
run(gradleCommand(), [gradleTask], { cwd: androidDir });

const outputDir = join(androidDir, 'app/build/outputs/apk', buildType);
const apks = findApks(outputDir);
if (apks.length === 0) {
  throw new Error(`No APK files found in ${outputDir}`);
}

console.log(`Android ${buildType} APK generated:`);
for (const apk of apks) {
  console.log(`  ${apk}`);
}

function parseOptions(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--') continue;
    if (!arg.startsWith('--')) continue;

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index++;
    } else {
      parsed[key] = true;
    }
  }

  return parsed;
}

function toAndroidVersionCode(versionName) {
  const match = versionName.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid --version "${versionName}". Expected format: major.minor.patch`);
  }

  const [, majorRaw, minorRaw, patchRaw] = match;
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);
  if (minor > 999 || patch > 999) {
    throw new Error('Invalid --version. Minor and patch must be between 0 and 999.');
  }

  const versionCode = major * 1_000_000 + minor * 1_000 + patch;
  if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || versionCode > 2_100_000_000) {
    throw new Error('Invalid --version. Derived Android versionCode must be 1..2100000000.');
  }

  return versionCode;
}

function run(command, args, options) {
  execFileSync(command, args, {
    ...options,
    stdio: 'inherit',
  });
}

function gradleCommand() {
  return process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
}

function findApks(outputDir) {
  if (!existsSync(outputDir)) return [];

  return readdirSync(outputDir)
    .filter((file) => file.endsWith('.apk'))
    .map((file) => join(outputDir, file))
    .sort((a, b) => basename(a).localeCompare(basename(b)));
}

function printHelp() {
  console.log(`Usage:
  pnpm release:android -- --version <major.minor.patch> [--debug]

Examples:
  pnpm release:android -- --version 1.2.3
  pnpm release:android -- --version 1.2.3 --debug
`);
}
