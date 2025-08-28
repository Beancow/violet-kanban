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
// aggregate findings for a machine-readable report
const report = {
    forbiddenTypes: [],
    longFiles: [],
    multiExportFiles: [],
    missingFiles: [],
    providerMigrationsNeeded: [],
    // Human-readable descriptions of validator rules to make the JSON
    // report self-describing for downstream consumers and reviewers.
    rules: {
        forbiddenTypes:
            'Disallow usage of `any`, `as any`, `unknown`, and `Record<string, unknown>` in non-test source files.',
        longFiles:
            'Warn on files longer than 300 lines to encourage splitting large files into focused modules.',
        multiExportFiles:
            'Fail when a file exports multiple unrelated symbols (encourage single-responsibility files), with exemptions for barrels, types, utils, providers and hooks.',
        inlineTypes:
            'Disallow `type` or `export type` declarations outside of `src/types/`; new types should live centrally under `src/types`.',
        duplicateTypesFound:
            'Detect duplicate inline type declarations with identical name and text across files (likely copy/paste).',
        typeofUsage:
            'Warn when `typeof` checks are used inline; prefer runtime type guards exported from `src/types/typeGuards.ts`.',
        missingFiles:
            'Required DEV_GUIDELINES files that should exist in the repo to satisfy baseline expectations.',
        providerMigrationsNeeded:
            'Detect providers that are missing a corresponding ProviderShim (migration helper).',
    },
    // Frozen files: paths or directory patterns to exclude from validator checks.
    // Use a suffix of '/**' to ignore everything under a directory.
    frozenFiles:
        "List of repo-relative paths (strings) excluded from validator checks. Use 'dir/**' to ignore all files under a directory.",
};

// Files or directories that should be ignored by the validator. Update this
// list if there are vendored/generated files or long-lived exceptions you
// want to keep out of the checks.
const frozenFiles = [
    // example: 'src/generated/**',
    // add repo-relative paths here to opt files out of validation
    'src/components/SyncManager.tsx',
];

// Automatically add provider files (under src/providers) without 'Shim' in
// the filename to the frozen list — these provider implementations are
// often in-progress and can generate many validator hits. We only add the
// literal file paths (not directories) so other files remain checked.
try {
    const providersDir = path.join(root, 'src', 'providers');
    if (fs.existsSync(providersDir)) {
        const files = fs.readdirSync(providersDir);
        for (const f of files) {
            // match e.g. BoardProvider.tsx, AuthProvider.tsx, but skip *Shim* files
            if (/Provider\.(t|j)sx?$/.test(f) && !/Shim/i.test(f)) {
                const rel = path.posix.join('src', 'providers', f);
                if (!frozenFiles.includes(rel)) frozenFiles.push(rel);
            }
        }
    }
} catch (_) {}

function isFrozen(relPath) {
    if (!relPath) return false;
    const r = relPath.replace(/\\/g, '/');
    for (const p of frozenFiles) {
        if (!p) continue;
        const pp = p.replace(/\\/g, '/');
        if (pp.endsWith('/**')) {
            const prefix = pp.slice(0, -3);
            if (r.startsWith(prefix)) return true;
        }
        if (r === pp) return true;
    }
    return false;
}
// Files we intentionally exclude from certain noisy checks (typeGuards, schemas)
function isExcludedForNoise(relPath) {
    if (!relPath) return false;
    const r = relPath.replace(/\\/g, '/');
    // exclude the primary runtime guards file and all schema files
    if (r === 'src/types/typeGuards.ts') return true;
    if (r.startsWith('src/schema/')) return true;
    return false;
}
// expose frozen list in the machine-readable report as objects with `path`
report.frozenFiles = (frozenFiles || []).map((p) => ({ path: p }));
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
            text =
                head +
                '\n' +
                (tail.length ? tail + (text.length > 140 ? '…' : '') : '');
        } else {
            text = truncate(text, 140);
        }
        return { file: rel, line: Number(m[2]), text };
    }
    return { file: path.relative(root, line) };
}

function printTable(
    title,
    rows,
    columns,
    severity = 'warn',
    forceBlock = false
) {
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
            if (Object.prototype.hasOwnProperty.call(r, 'status')) return r;
            return Object.assign({ status: icon }, r);
        });

        // If the table is large or wide, render as a single multi-line block so other console output
        // doesn't interleave and break the visual structure in some terminals.
        const maxFileLen = displayRows.reduce(
            (m, r) => Math.max(m, String(r.file || r.path || '').length),
            0
        );
        // lower thresholds: wide > 40 chars, large > 8 rows
        const wide = maxFileLen > 40;
        const large = displayRows.length > 8;
        const useBlock = forceBlock || wide || large;
        if (wide || large) {
            // fallback to block mode
            const cols =
                columns && columns.length
                    ? ['status'].concat(columns.filter((c) => c !== 'status'))
                    : null;
            const headerLine = cols
                ? cols.map((c) => c.toUpperCase()).join(' | ')
                : Object.keys(displayRows[0] || {}).join(' | ');
            const lines = [headerLine];
            for (const r of displayRows) {
                if (cols) {
                    lines.push(
                        cols
                            .map((c) => String(r[c] === undefined ? '' : r[c]))
                            .join(' | ')
                    );
                } else {
                    lines.push(
                        Object.values(r)
                            .map((v) => String(v))
                            .join(' | ')
                    );
                }
            }
            const block = lines.join('\n');
            if (severity === 'fail') console.error(block);
            else if (severity === 'ok') console.log(block);
            else console.warn(block);
        } else if (!useBlock) {
            if (columns) {
                // ensure status is the first column in the printed table
                const cols = ['status'].concat(
                    columns.filter((c) => c !== 'status')
                );
                console.table(
                    displayRows.map((r) =>
                        cols.reduce((acc, c) => ((acc[c] = r[c]), acc), {})
                    )
                );
            } else {
                console.table(displayRows);
            }
        }
    } catch (e) {
        // fallback
        rows.forEach((r) => console.warn('  ', JSON.stringify(r)));
    }
}

// Strict banned-type check outside of tests: disallow `any`, `as any`, `unknown`, and `Record<string, unknown>`
// in non-test source files. Tests and mocks are excluded.
(function bannedTypeCheck() {
    const pattern = ': any|as any|\bunknown\b|Record<s*strings*,s*unknowns*>';
    const out = grep(pattern, path.join(root, 'src'));
    const filtered = out
        .map((l) => ({ raw: l, parsed: parseGrepLine(l) }))
        .filter(({ parsed }) => {
            const file = parsed.file || '';
            const isTest =
                /(?:\.spec\.|\.test\.|\/tests\/|\/__mocks__\/|__tests__\/)/i.test(
                    file
                );
            return !isTest && !isFrozen(file) && !isExcludedForNoise(file);
        })
        .map((p) => p.raw);
    if (filtered.length) {
        const parsed = filtered.map(parseGrepLine);
        function detectMatch(t) {
            if (!t) return 'match';
            if (/\bas any\b/.test(t)) return 'as any';
            if (/(:\s*any)\b/.test(t)) return ': any';
            if (/\bRecord\s*<\s*string\s*,\s*unknown\s*>/.test(t))
                return 'Record<string, unknown>';
            if (/\bunknown\b/.test(t)) return 'unknown';
            return 'match';
        }
        const rows = parsed.map((p) => ({
            line: p.line || 0,
            file: path.relative(root, p.file || ''),
            match: detectMatch(p.text),
        }));
        // populate machine-readable report
        report.forbiddenTypes = rows;
        printTable(
            '\u2716 Forbidden type usage found outside tests (remove any/unknown/Record<string, unknown>):',
            rows,
            ['line', 'file', 'match'],
            'fail'
        );
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
        const longFileRows = longFiles.map((l) => ({
            path: path.relative(root, l.path),
            lines: l.lines,
        }));
        report.longFiles = longFileRows;
        printTable(
            '\u26a0 Files longer than 300 lines detected (consider splitting):',
            longFileRows,
            ['path', 'lines'],
            'warn',
            false
        );
        // non-fatal warning
        process.exitCode = 2;
    }
    for (const f of allFiles) {
        const base = path.basename(f).toLowerCase();
        // allow barrel files named index.*
        if (base.startsWith('index.')) continue;
        // allow multiple exports inside types, utils, providers and helper files
        const relPath = path.relative(root, f).replace(/\\/g, '/');
        const lpath = relPath.toLowerCase();
        const baseName = path.basename(f).toLowerCase();
        if (
            lpath.startsWith('src/types/') ||
            lpath.startsWith('src/utils/') ||
            // allow files that are named *Provider* (e.g. BoardProvider.tsx) to export multiple symbols
            baseName.includes('provider') ||
            // allow hook-like files (use*) to export multiple helpers
            baseName.includes('use') ||
            lpath.includes('/helpers/') ||
            lpath.includes('helper')
        ) {
            // skip these directories from the strict multi-export rule
            continue;
        }
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
        const multiRows = multiExportFiles.map((m) => ({
            path: path.relative(root, m.path),
            exports: m.exports,
        }));
        report.multiExportFiles = multiRows;
        printTable(
            'Files with multiple exports (split single-responsibility handlers into separate files):',
            multiRows,
            ['path', 'exports'],
            'fail',
            true // force block mode for this table
        );
        console.error(
            'Note: barrel files named `index.*` are allowed to re-export multiple symbols.'
        );
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
        const missing = needs.filter(
            (n) =>
                !new RegExp(`export\\s+(const|function)\\s+${n}`, 'm').test(txt)
        );
        if (missing.length) {
            warnMsg(
                `typeGuards missing expected guards (warning): ${missing.join(
                    ', '
                )}`
            );
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

// print compact summary then write report JSON
printSummary();

// Print the frozen files table so it's easy to grep/filter in CI logs
if (Array.isArray(report.frozenFiles) && report.frozenFiles.length) {
    printTable(
        'Frozen files excluded from checks (these are intentionally skipped):',
        report.frozenFiles,
        ['path'],
        'warn',
        true
    );
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

// compact summary for console at end
function printSummary() {
    function fmtCount(n) {
        return n === 0 ? 'none found ✔' : String(n);
    }
    const summary = buildSummary();
    console.log('\n ### Short summary ###');
    console.log(`missingFiles: ${fmtCount(summary.missingFiles)}`);
    console.log(`forbiddenTypes: ${fmtCount(summary.forbiddenTypes)}`);
    console.log(`multiExportFiles: ${fmtCount(summary.multiExportFiles)}`);
    console.log(`longFiles: ${fmtCount(summary.longFiles)}`);
    console.log(
        `typeDeclarationsOutsideTypes: ${fmtCount(
            summary.typeDeclarationsOutsideTypes
        )}`
    );
    console.log(
        `typesDeclaredInline: ${fmtCount(summary.typesDeclaredInline)}`
    );
    console.log(
        `duplicateTypesFound: ${fmtCount(summary.duplicateTypesFound)}`
    );
    console.log(
        `typeofUsageWarnings: ${fmtCount(summary.typeofUsageWarnings)}`
    );
    console.log(`frozenFiles: ${fmtCount(summary.frozenFiles)}`);
}

// build a numeric summary object used by both console output and the JSON report
function buildSummary() {
    return {
        missingFiles: (report.missingFiles || []).length,
        forbiddenTypes: (report.forbiddenTypes || []).length,
        multiExportFiles: (report.multiExportFiles || []).length,
        longFiles: (report.longFiles || []).length,
        typeDeclarationsOutsideTypes: (report.inlineTypes || []).length,
        typesDeclaredInline: (report.inlineTypes || []).length,
        duplicateTypesFound: (report.duplicateTypesFound || []).length,
        typeofUsageWarnings: (report.typeofUsage || []).length,
        frozenFiles: (report.frozenFiles || []).length,
        providerMigrationsNeeded: (report.providerMigrationsNeeded || [])
            .length,
    };
}

if (missingFiles.length) {
    report.missingFiles = missingFiles.map((p) => ({ path: p }));
    printTable(
        'Missing required files:',
        report.missingFiles,
        ['path'],
        'fail'
    );
    fail('Some required files are missing');
}

// New rule: disallow `export type` or `type` declarations outside of src/types
(function centralizedTypesCheck() {
    const allFiles = walkDir(srcRoot);
    const violations = [];
    for (const f of allFiles) {
        const rel = path.relative(root, f).replace(/\\/g, '/');
        // skip files under src/types
        if (rel.startsWith('src/types/')) continue;
        try {
            const txt = fs.readFileSync(f, 'utf8');
            // crude: look for `export type` or `type X =` at start of line
            const lines = txt.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // capture the declared type name and the declaration text so we can
                // later detect duplicate declarations (matching name + text)
                const exportMatch = line.match(
                    /^export\s+type\s+([A-Za-z0-9_]+)/
                );
                const typeMatch = line.match(/^type\s+([A-Za-z0-9_]+)\s*=/);
                if (exportMatch || typeMatch) {
                    const name =
                        (exportMatch && exportMatch[1]) ||
                        (typeMatch && typeMatch[1]);
                    violations.push({
                        file: rel,
                        line: i + 1,
                        name,
                        text: line,
                    });
                }
            }
        } catch (e) {}
    }
    if (violations.length) {
        // store richer inline type info (name + text + location) in the report
        report.inlineTypes = violations.map((v) => ({
            file: v.file,
            line: v.line,
            name: v.name,
            text: v.text,
        }));
        printTable(
            'Type declarations outside of src/types detected (move types to src/types):',
            violations,
            ['file', 'line', 'text'],
            'fail'
        );
        // continue to failing state so CI highlights the issue; duplicate detection
        // runs after this block and will augment the report object.
        fail('Found type declarations outside of src/types');
    }
})();

// Detect duplicate inline type declarations: duplicates require both the type
// name and declaration text to match across multiple files (copy/paste cases).
(function duplicateInlineTypesCheck() {
    const inline = report.inlineTypes || [];
    const groups = Object.create(null);
    for (const v of inline) {
        const key = `${v.name}||${v.text}`;
        if (!groups[key])
            groups[key] = { name: v.name, text: v.text, occurrences: [] };
        groups[key].occurrences.push({ file: v.file, line: v.line });
    }
    const duplicates = Object.values(groups).filter(
        (g) => g.occurrences.length > 1
    );
    if (duplicates.length) {
        report.duplicateTypesFound = duplicates.map((d) => ({
            name: d.name,
            text: d.text,
            occurrences: d.occurrences,
        }));
        // present a compact table to help authors find duplicate declarations
        const rows = report.duplicateTypesFound.map((d) => ({
            name: d.name,
            occurrences: d.occurrences
                .map((o) => `${o.file}:${o.line}`)
                .join(', '),
            text: d.text,
        }));
        printTable(
            'Duplicate inline type declarations detected (same name + text):',
            rows,
            ['name', 'occurrences', 'text'],
            'fail',
            true
        );
    } else {
        report.duplicateTypesFound = [];
    }
})();

// New rule: prefer type guards to inline `typeof` checks — find `typeof x` in non-test files
(function typeofUsageCheck() {
    // Find inline `typeof` usages. Use a single grep with alternation to
    // detect either `typeof (` or `typeof x` patterns.
    const out = grep(
        'typeof\\s*\\(|typeof\\s+[a-zA-Z_]',
        path.join(root, 'src')
    );
    const filtered = out.filter(
        (l) => !/(?:\.test\.|\.spec\.|\/tests\/|__mocks__)/i.test(l)
    );
    // parse and exclude any frozen or noisy files from this check
    let parsed = filtered
        .map(parseGrepLine)
        .filter((p) => !isFrozen(p.file) && !isExcludedForNoise(p.file));
    if (parsed.length) {
        report.typeofUsage = parsed.map((p) => ({
            file: p.file,
            line: p.line,
        }));
        printTable(
            'Inline `typeof` usage found (prefer type guards in src/types/typeGuards.ts):',
            parsed,
            ['file', 'line', 'text'],
            'fail'
        );
        // Make typeof usage a failing rule so CI highlights these occurrences.
        fail(
            'Inline `typeof` usage detected; prefer runtime guards in src/types/typeGuards.ts'
        );
    }
})();

if (missingFiles.length) {
    report.missingFiles = missingFiles.map((f) => ({ path: f }));
    printTable(
        'Missing required files per DEV_GUIDELINES:',
        report.missingFiles,
        ['path'],
        'fail',
        true // force block mode for missing-files list
    );
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
        report.providerMigrationsNeeded = providerMigrationsNeeded.map((p) => ({
            path: p,
        }));
        printTable(
            'Provider shims missing for the following providers (migration required):',
            report.providerMigrationsNeeded,
            ['path'],
            'fail',
            true
        );
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
    fail(
        'Found `src/stores/helpers` — move store-specific helpers into the relevant xStoreDB or xQueueDB folders'
    );
}

// AST-based check: detect functions that accept `unknown` (or have an implicit
// parameter type) and then cast that parameter inside the function body
// (e.g. `const p = input as SomeType`). This usually indicates the function
// would benefit from a generic parameter or an explicit input type instead of
// internal casts. The rule warns by default and can be made fatal with
// `--fail-on-unknown-casts` or `VALIDATOR_FAIL_ON_UNKNOWN_CASTS=1`.
(function unknownParamCastCheck() {
    let ts;
    try {
        ts = require('typescript');
    } catch (e) {
        // typescript not available; skip this check
        return;
    }
    const enableFail = process.argv.includes('--fail-on-unknown-casts') || process.env.VALIDATOR_FAIL_ON_UNKNOWN_CASTS === '1';
    const allFiles = walkDir(srcRoot);
    const matches = [];
    for (const f of allFiles) {
        const rel = path.relative(root, f).replace(/\\/g, '/');
        if (isFrozen(rel)) continue;
        if (isExcludedForNoise(rel)) continue;
        // skip tests and mocks
        if (/(?:\.spec\.|\.test\.|\/tests\/|__mocks__|__tests__)/i.test(rel)) continue;
        try {
            const src = fs.readFileSync(f, 'utf8');
            const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ESNext, true);

            function checkFunctionNode(node) {
                // handle function-like nodes: declarations, expressions, arrows, methods
                if (
                    ts.isFunctionDeclaration(node) ||
                    ts.isFunctionExpression(node) ||
                    ts.isArrowFunction(node) ||
                    ts.isMethodDeclaration(node)
                ) {
                    if (!node.parameters || node.parameters.length === 0) return;
                    node.parameters.forEach((param) => {
                        const paramId = param.name && ts.isIdentifier(param.name) ? param.name.text : null;
                        if (!paramId) return;
                        const hasUnknownType = param.type && param.type.kind === ts.SyntaxKind.UnknownKeyword;
                        const hasNoType = !param.type;
                        if (!hasUnknownType && !hasNoType) return;

                        // search body for as-expressions or type-assertions that use the parameter
                        let found = false;
                        function findInBody(n) {
                            if (found) return;
                            // as-expression: <expr> as Type
                            if (ts.isAsExpression(n) || ts.isTypeAssertionExpression(n)) {
                                const inner = n.expression;
                                if (ts.isIdentifier(inner) && inner.text === paramId) {
                                    found = true;
                                    return;
                                }
                            }
                            // variable initializer like: const p = param as Foo
                            if (ts.isVariableDeclaration(n) && n.initializer) {
                                const init = n.initializer;
                                if ((ts.isAsExpression(init) || ts.isTypeAssertionExpression(init)) && ts.isIdentifier(init.expression) && init.expression.text === paramId) {
                                    found = true;
                                    return;
                                }
                            }
                            ts.forEachChild(n, findInBody);
                        }

                        if (node.body) findInBody(node.body);
                        if (found) {
                            const loc = sf.getLineAndCharacterOfPosition(param.pos || 0);
                            matches.push({ file: rel, line: loc.line + 1, param: paramId, unknown: hasUnknownType, implicit: hasNoType });
                        }
                    });
                }
                ts.forEachChild(node, checkFunctionNode);
            }

            checkFunctionNode(sf);
        } catch (e) {
            // ignore parse errors for now
        }
    }

    if (matches.length) {
        report.unknownParamCasts = matches;
        printTable(
            'Functions accepting `unknown`/implicit params then casting them inside (prefer generics or explicit input types):',
            matches,
            ['file', 'line', 'param'],
            'warn',
            true
        );
        if (enableFail) {
            fail('Found unknown/implicit parameter casts');
        } else {
            warnMsg('Unknown/implicit parameter casts detected (warning). Use --fail-on-unknown-casts to make this an error.');
            // mark validator with a warning exit code to surface in CI if desired
            process.exitCode = Math.max(process.exitCode || 0, 2);
        }
    }
})();

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
        warnMsg(
            `Found top-level files in src/stores/${sub} — ensure store DB logic lives under a *DB folder (e.g. ${sub}StoreDB/)`
        );
        process.exitCode = 2;
    }
}

if (process.exitCode && process.exitCode !== 2) {
    // a non-warning exit code indicates failure
    console.error('\u001b[31mValidation failed. See messages above.\u001b[0m');
} else if (process.exitCode === 2) {
    console.warn(
        '\u001b[33mValidation completed with warnings (exit code 2)\u001b[0m'
    );
} else {
    ok('Validation completed with no errors');
}

// write machine-readable report for CI to consume
function writeReport(reportObj) {
    try {
        const outDir = path.join(root, 'reports');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const outFile = path.join(outDir, 'validate-dev-guidelines.json');
        fs.writeFileSync(outFile, JSON.stringify(reportObj, null, 2), 'utf8');
        console.log('\nValidation report written to ' + outFile);
    } catch (err) {
        console.error('Failed to write validation report:', err && err.message);
    }
}

// short summary + persist report
writeReport(report);
// attach numeric summary to the machine-readable report for CI
report.summary = buildSummary();

// colorized final summary for human consumption
console.log('\n ### Final summary ###');
const red = '\u001b[31m';
const yellow = '\u001b[33m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
function colorLine(key, count) {
    const val = count === 0 ? 'none found ✔' : String(count);
    // choose color: red if any failures (non-zero and not warning-only), yellow if warnings, green if clean
    // For simplicity: forbiddenTypes and duplicateTypesFound are failures; typeofUsageWarnings and longFiles are warnings
    const failKeys = [
        'forbiddenTypes',
        'duplicateTypesFound',
        'multiExportFiles',
        'typeDeclarationsOutsideTypes',
        'typesDeclaredInline',
        'typeofUsageWarnings',
    ];
    const warnKeys = ['longFiles', 'providerMigrationsNeeded'];
    let color = green;
    if (failKeys.includes(key) && count > 0) color = red;
    else if (warnKeys.includes(key) && count > 0) color = yellow;
    return `${color}${key}: ${val}${reset}`;
}
const s = report.summary || buildSummary();
console.log(colorLine('missingFiles', s.missingFiles));
console.log(colorLine('forbiddenTypes', s.forbiddenTypes));
console.log(colorLine('multiExportFiles', s.multiExportFiles));
console.log(colorLine('longFiles', s.longFiles));
console.log(
    colorLine('typeDeclarationsOutsideTypes', s.typeDeclarationsOutsideTypes)
);
console.log(colorLine('typesDeclaredInline', s.typesDeclaredInline));
console.log(colorLine('duplicateTypesFound', s.duplicateTypesFound));
console.log(colorLine('typeofUsageWarnings', s.typeofUsageWarnings));
console.log(colorLine('frozenFiles', s.frozenFiles));
