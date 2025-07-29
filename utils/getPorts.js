// when calling with node ./utils/getPorts.js the script just hangs

if (
    typeof process === 'undefined' ||
    !process.versions ||
    !process.versions.node
) {
    console.error('This script must be run in a Node.js environment.');
    console.info(
        'Usage: curl localhost:4400/emulators | node ./utils/getPorts.js'
    );
    console.info(
        'This script expects a JSON object with service configurations.'
    );
    console.info('Example input:');
    console.info(require('fs').readFileSync('./example.json', 'utf8'));
    process.exit(1);
}

const fs = require('fs');

function readStdinSync() {
    if (process.stdin.isTTY) {
        console.error('No input detected on stdin.');
        console.info(
            'Usage: curl localhost:4400/emulators | node ./utils/getPorts.js'
        );
        console.info(
            'This script expects a JSON object with service configurations. \nExample input:'
        );
        console.info(fs.readFileSync('./utils/ports-example.json', 'utf8'));
        process.exit(1);
    }
    return fs.readFileSync(0, 'utf8');
}

const input = JSON.parse(readStdinSync());

function printTable(title, rows) {
    const colWidths = [
        Math.max(...rows.map((r) => r[0].length), 12),
        Math.max(...rows.map((r) => r[1].length), 7),
    ];
    const line =
        '+' +
        '-'.repeat(colWidths[0] + 2 + 'http://'.length) +
        '+' +
        '-'.repeat(colWidths[1] + 2) +
        '+';
    console.log(`\n${title}`);
    console.log(line);
    console.log(
        `| ${'Service'.padEnd(colWidths[0])} | ${'Address:Port'.padEnd(colWidths[1] + 'http://'.length)} |`
    );
    console.log(line);
    rows.forEach(([name, addr]) => {
        console.log(
            `| ${name.padEnd(colWidths[0])} | ${'http://' + addr.padEnd(colWidths[1])} |`
        );
    });
    console.log(line);
}

function main() {
    const data = input;
    for (const [service, config] of Object.entries(data)) {
        if (typeof config !== 'object' || config === null) continue;
        let rows = [];
        if (Array.isArray(config.listen)) {
            config.listen.forEach((l) =>
                rows.push([config.name || service, `${l.address}:${l.port}`])
            );
        } else if (config.host && config.port) {
            rows.push([
                config.name || service,
                `${config.host}:${config.port}`,
            ]);
        }
        if (rows.length) printTable(service, rows);

        // Print sub-tables for sub-services (if any)
        for (const [key, value] of Object.entries(config)) {
            if (
                value &&
                typeof value === 'object' &&
                !Array.isArray(value) &&
                value.host &&
                value.port
            ) {
                // Handle nested sub-service object
                printTable(`${service} - ${key}`, [
                    [value.name || key, `http://${value.host}:${value.port}`],
                ]);
            } else if (
                Array.isArray(value) &&
                value.length &&
                typeof value[0] === 'object' &&
                value[0].address &&
                value[0].port
            ) {
                const subRows = value.map((l) => [
                    key,
                    `${l.address}:${l.port}`,
                ]);
                printTable(`${service} - ${key}`, subRows);
            }
        }
    }
}

main();
