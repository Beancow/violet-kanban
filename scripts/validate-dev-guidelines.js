#!/usr/bin/env node
// Lightweight validator for DEV_GUIDELINES rules.
// - Checks that `@/types` directory exists (src/types fallback)
// - Checks that there is a `src/stores` folder
// - Simple grep for `: any` or `as any` inside `src/services` which often indicates avoided guards
// Exit code 1 on validation failure.

const fs = require('fs');
const path = require('path');
const child = require('child_process');

function fail(msg) {
    const red = '\u001b[31m';
    const reset = '\u001b[0m';
    console.error(`${red}✖ ${msg}${reset}`);
    process.exitCode = 1;
}

function ok(msg) {
    const green = '\u001b[32m';
    const reset = '\u001b[0m';
    console.log(`${green}✔ ${msg}${reset}`);
}

function warnMsg(msg) {
    const yellow = '\u001b[33m';
    const reset = '\u001b[0m';
    console.warn(`${yellow}⚠ ${msg}${reset}`);
}

const root = process.cwd();
// check types dir
const preferredTypes = path.join(root, 'src', 'types');
const altTypes = path.join(root, 'types');
if (fs.existsSync(preferredTypes) || fs.existsSync(altTypes)) {
    ok('types directory exists');
} else {
    fail('Missing types folder. Expected `src/types/` or top-level `types/`.');
}
function grep(pattern, dir) {
    try {
        const out = child.execSync(
            `grep -RIn --exclude-dir=node_modules --exclude-dir=coverage -E "${pattern}" ${dir} || true`,
            { encoding: 'utf8' }
        );
        return out.trim().split('\n').filter(Boolean);
    } catch (e) {
        return [];
    }
}

function parseGrepLine(line) {
    // expected format: /abs/path/to/file:line:content
    const m = line.match(/^(.*?):(\d+):(.*)$/);
    function truncate(s, n = 120) {
        if (!s) return s;
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }
    if (m) {
        const abs = m[1];
        const rel = path.relative(root, abs);
        let text = (m[3] || '').trim().replace(/\s+/g, ' ');
            // insert a newline to help stdout/table wrap in terminals
            if (text.length > 80) {
                const head = text.slice(0, 60);
                const tail = text.slice(60, 140);
                text = head + '\n' + (tail.length ? tail + (text.length > 140 ? '…' : '') : '');
            } else {
                text = truncate(text, 140);
            }
        return { file: rel, line: Number(m[2]), text };
    }
    return { file: path.relative(root, line) };
}

function printTable(title, rows, columns, severity = 'warn') {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const green = '\u001b[32m';
    const red = '\u001b[31m';
    const yellow = '\u001b[33m';
    const reset = '\u001b[0m';
    let header = title;
    if (severity === 'ok') header = `${green}✔ ${title}${reset}`;
    else if (severity === 'fail') header = `${red}✖ ${title}${reset}`;
    else header = `${yellow}⚠ ${title}${reset}`;

    if (severity === 'fail') console.error(header);
    else if (severity === 'ok') console.log(header);
    else console.warn(header);

    try {
        // add a status column to each row so the table shows a tick/cross per row
    // use plain unicode icons for table cells (avoid ANSI escapes which console.table escapes)
    const icon = severity === 'ok' ? '✔' : severity === 'fail' ? '✖' : '⚠';
        const displayRows = rows.map((r) => {
            // don't override if caller already set a status
            if (Object.prototype.hasOwnProperty.call(r, 'status')) return r;
            return Object.assign({ status: icon }, r);
        });
        if (columns) {
            // ensure status is the first column in the printed table
            const cols = ['status'].concat(columns.filter((c) => c !== 'status'));
            console.table(displayRows.map((r) => cols.reduce((acc, c) => ((acc[c] = r[c]), acc), {})));
        } else {
            console.table(displayRows);
        }
    } catch (e) {
        // fallback
        rows.forEach((r) => console.warn('  ', JSON.stringify(r)));
    }
}

// Strict banned-type check outside of tests: disallow `any`, `as any`, `unknown`, and `Record<string, unknown>`
// in non-test source files. Tests and mocks are excluded.
(function bannedTypeCheck() {
    const pattern = ': any|as any|\bunknown\b|Record<\s*string\s*,\s*unknown\s*>';
    const out = grep(pattern, path.join(root, 'src'));
    // filter out true test files (filenames with .spec. or .test. or paths containing /tests/ or /__mocks__/)
    const filtered = out.filter((l) => {
        const parts = l.split(':');
        const file = parts[0] || '';
        const isTest = /(?:\.spec\.|\.test\.|\/tests\/|\/__mocks__\/|__tests__\/)/i.test(file);
        return !isTest;
    });
    if (filtered.length) {
        const parsed = filtered.map(parseGrepLine);
        function detectMatch(t) {
            if (!t) return 'match';
            if (/\bas any\b/.test(t)) return 'as any';
            if (/(:\s*any)\b/.test(t)) return ': any';
            if (/\bRecord\s*<\s*string\s*,\s*unknown\s*>/.test(t)) return 'Record<string, unknown>';
            if (/\bunknown\b/.test(t)) return 'unknown';
            return 'match';
        }
        const rows = parsed.map((p) => ({ line: p.line || 0, file: path.relative(root, p.file || ''), match: detectMatch(p.text) }));
        printTable('\u2716 Forbidden type usage found outside tests (remove any/unknown/Record<string, unknown>):', rows, ['line', 'file', 'match'], 'fail');
        // This is strict: fail the validator so authors fix types outside tests.
        fail('Forbidden type usage found outside tests');
    }
})();

// Check for files with multiple exports (except barrel files like index.ts)
function walkDir(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (
                ['node_modules', 'coverage', 'tests', '__mocks__'].includes(
                    e.name
                )
            )
                continue;
            files = files.concat(walkDir(p, extensions));
        } else if (e.isFile()) {
            const ext = path.extname(e.name).toLowerCase();
            if (extensions.includes(ext)) files.push(p);
        }
    }
    return files;
}

const srcRoot = path.join(root, 'src');
const multiExportFiles = [];
if (fs.existsSync(srcRoot)) {
    const allFiles = walkDir(srcRoot);
    // warn on files > 300 lines to encourage splitting large files
    const longFiles = [];
    for (const f of allFiles) {
        try {
            const txt = fs.readFileSync(f, 'utf8');
            const lines = txt.split(/\r?\n/).length;
            if (lines > 300) longFiles.push({ path: f, lines });
        } catch (e) {}
    }
    if (longFiles.length) {
    printTable('\u26a0 Files longer than 300 lines detected (consider splitting):', longFiles.map((l) => ({ path: path.relative(root, l.path), lines: l.lines })), ['path', 'lines'], 'warn');
    // non-fatal warning
    process.exitCode = 2;
    }
    for (const f of allFiles) {
        const base = path.basename(f).toLowerCase();
        // allow barrel files named index.*
        if (base.startsWith('index.')) continue;
        try {
            const txt = fs.readFileSync(f, 'utf8');
            const matches = txt.match(/^\s*export\b/gm) || [];
            if (matches.length > 1) {
                multiExportFiles.push({ path: f, exports: matches.length });
            }
        } catch (e) {
            /* ignore unreadable files */
        }
    }
    if (multiExportFiles.length) {
    printTable('Files with multiple exports (split single-responsibility handlers into separate files):', multiExportFiles.map((m) => ({ path: path.relative(root, m.path), exports: m.exports })), ['path', 'exports'], 'fail');
    console.error('Note: barrel files named `index.*` are allowed to re-export multiple symbols.');
    process.exitCode = 1;
    } else {
        ok('No files with multiple exports detected (non-barrel)');
    }
} else {
    console.warn('No src/ directory found; skipping multi-export checks');
}

// Check for minimal guard exports in src/types/typeGuards.ts (warning only)
const typeGuardsPath = path.join(root, 'src', 'types', 'typeGuards.ts');
if (fs.existsSync(typeGuardsPath)) {
    try {
        const txt = fs.readFileSync(typeGuardsPath, 'utf8');
        const needs = ['isObject', 'isActionLike', 'hasOrganizationId'];
        const missing = needs.filter((n) => !new RegExp(`export\\s+(const|function)\\s+${n}`,'m').test(txt));
        if (missing.length) {
        warnMsg(`typeGuards missing expected guards (warning): ${missing.join(', ')}`);
        process.exitCode = 2;
        } else {
            ok('typeGuards exports look reasonable');
        }
    } catch (e) {
        /* ignore */
    }
} else {
    console.warn('typeGuards not found; add src/types/typeGuards.ts');
}

// Required files (per DEV_GUIDELINES). These files may not exist yet; the
// validator will fail if they are missing so the TODOs are visible in CI.
const requiredFiles = [
    'DEV_GUIDELINES.md',
    'src/types/queue.ts',
    'src/types/syncError.ts',
    'src/types/typeGuards.ts',
    'src/stores/queues/boardQueueDB/boardQueueDB.ts',
    'src/stores/queues/listQueueDB/listQueueDB.ts',
    'src/stores/queues/cardQueueDB/cardQueueDB.ts',
    'src/stores/organizations/organizationsDB/organizationsDB.ts',
    'src/stores/organizationData/boardStoreDB/boardStoreDB.ts',
    'src/stores/organizationData/listStoreDB/listStoreDB.ts',
    'src/stores/organizationData/cardStoreDB/cardStoreDB.ts',
    'src/stores/ui/toastStoreDB/toastStoreDB.ts',
    'src/stores/ui/uiStoreDB/uiStoreDB.ts',
    'src/stores/errors/syncErrorDB/syncErrorDB.ts',
    'src/stores/TempIdMapStore.ts',
    'src/services/orchestration/OrchestratorService.ts',
    'src/services/orchestration/jobs/actionSuccess.ts',
    'src/services/orchestration/jobs/backoff.ts',
    'src/services/orchestration/jobs/buildAction.ts',
    'src/services/orchestration/jobs/pickNext.ts',
    'src/services/orchestration/jobs/postAndWait.ts',
    'src/services/orchestration/worker/workerOut/workerPoster.ts',
    'src/services/orchestration/worker/workerIn/workerMessages/handleSuccess.ts',
    'src/services/orchestration/worker/workerIn/workerMessages/handleError.ts',
    'src/services/orchestration/utils/inFlightManager.ts',
    'src/utils/eventBus.ts',
    'src/utils/eventBusClient.ts',
    // suggested additions
    'src/providers/shims/BoardProviderShim.tsx',
    'src/providers/shims/ListProviderShim.tsx',
    'src/providers/shims/CardProviderShim.tsx',
    'src/providers/shims/OrganizationProviderShim.tsx',
    'src/providers/shims/QueueProviderShim.tsx',
    'src/providers/shims/ToastProviderShim.tsx',
    'src/providers/shims/UiProviderShim.tsx',
    'src/providers/shims/SyncErrorProviderShim.tsx',
    'src/providers/shims/AuthProviderShim.tsx',
    'src/providers/shims/AppProviderShim.tsx',
];

let missingFiles = [];
for (const p of requiredFiles) {
    const abs = path.join(root, p);
    if (!fs.existsSync(abs)) missingFiles.push(p);
}

    if (missingFiles.length) {
    printTable('Missing required files per DEV_GUIDELINES:', missingFiles.map((f) => ({ path: f })), ['path'], 'fail');
    // make this a failing condition so CI highlights missing implementations
    process.exitCode = 1;
} else {
    ok('All required files for DEV_GUIDELINES are present');
}

// Provider migration checks: find existing provider implementations and
// ensure a matching ProviderShim exists for each. This helps track where
// migration to stores/shims is still required.
const providersDir = path.join(root, 'src', 'providers');
const providerMigrationsNeeded = [];
if (fs.existsSync(providersDir)) {
    const files = fs.readdirSync(providersDir);
    for (const f of files) {
        const m = f.match(/^(.*Provider)\.(tsx?|ts)$/i);
        if (m) {
            const providerBase = m[1]; // e.g. BoardProvider
            const shimName = `${providerBase}Shim.ts`;
            const shimPath = path.join(providersDir, shimName);
            if (!fs.existsSync(shimPath)) {
                providerMigrationsNeeded.push(
                    path.join('src', 'providers', shimName)
                );
            }
        }
    }
    if (providerMigrationsNeeded.length) {
        printTable('Provider shims missing for the following providers (migration required):', providerMigrationsNeeded.map((p) => ({ path: p })), ['path'], 'fail');
        process.exitCode = 1;
    } else {
        ok('Provider shims exist for all detected providers');
    }
} else {
    console.warn('No providers directory found; skipping provider shim checks');
}

// Warn if there are helper files placed directly under src/stores/helpers
// or if store-specific helpers are not inside their DB folder.
const storeHelpersDir = path.join(root, 'src', 'stores', 'helpers');
if (fs.existsSync(storeHelpersDir)) {
    fail('Found `src/stores/helpers` — move store-specific helpers into the relevant xStoreDB or xQueueDB folders');
}

// Find any helper directories directly under src/stores that are not DB folders
const storeSubdirs = fs
    .readdirSync(path.join(root, 'src', 'stores'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
for (const sub of storeSubdirs) {
    const subPath = path.join(root, 'src', 'stores', sub);
    // look for helper files directly inside this dir (not nested under *DB)
    const files = fs
        .readdirSync(subPath)
        .filter(
            (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')
        );
    if (
        files.length &&
        !sub.toLowerCase().includes('db') &&
        sub !== 'helpers'
    ) {
        // if this directory contains files and it's not a DB directory, warn
    warnMsg(`Found top-level files in src/stores/${sub} — ensure store DB logic lives under a *DB folder (e.g. ${sub}StoreDB/)`);
    process.exitCode = 2;
    }
}

if (process.exitCode && process.exitCode !== 2) {
    // a non-warning exit code indicates failure
    console.error('\u001b[31mValidation failed. See messages above.\u001b[0m');
} else if (process.exitCode === 2) {
    console.warn('\u001b[33mValidation completed with warnings (exit code 2)\u001b[0m');
} else {
    ok('Validation completed with no errors');
}
