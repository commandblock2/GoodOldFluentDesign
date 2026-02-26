#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const API_BASE_ENV = "CLICKGUI_SETTINGS_API_BASE";

function printHelp() {
    console.log(`Usage: node docs/scripts/scan-runtime-setting-types.mjs [options]

Options:
  --api-base <url>      API base URL (for example: http://127.0.0.1:<port>/api/v1)
  --sample-size <n>     Sample module names per valueType (default: 8)
  --help, -h            Show this help

Environment:
  ${API_BASE_ENV}       Fallback API base URL if --api-base is not provided
`);
}

function parseArgs(argv) {
    const options = {
        apiBase: undefined,
        sampleSize: 8,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === "--help" || arg === "-h") {
            printHelp();
            process.exit(0);
        }

        if (arg === "--api-base") {
            const next = argv[i + 1];
            if (!next) {
                throw new Error("Missing value for --api-base.");
            }
            options.apiBase = next;
            i += 1;
            continue;
        }

        if (arg === "--sample-size") {
            const next = argv[i + 1];
            if (!next) {
                throw new Error("Missing value for --sample-size.");
            }
            const parsed = Number.parseInt(next, 10);
            if (!Number.isInteger(parsed) || parsed < 1) {
                throw new Error("--sample-size must be a positive integer.");
            }
            options.sampleSize = parsed;
            i += 1;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return options;
}

function normalizeApiBase(value) {
    if (typeof value !== "string") {
        throw new Error("API base must be a string.");
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
        throw new Error("API base cannot be empty.");
    }

    return trimmed.replace(/\/$/, "");
}

async function resolveApiBase(options) {
    if (options.apiBase) {
        return normalizeApiBase(options.apiBase);
    }

    const fromEnv = process.env[API_BASE_ENV];
    if (fromEnv && fromEnv.trim().length > 0) {
        return normalizeApiBase(fromEnv);
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
            `API base is required. Provide --api-base or set ${API_BASE_ENV}.`,
        );
    }

    const rl = createInterface({ input, output });
    try {
        const answer = await rl.question(
            "Enter API base URL (for example: http://127.0.0.1:<port>/api/v1): ",
        );
        return normalizeApiBase(answer);
    } finally {
        rl.close();
    }
}

function isObject(value) {
    return typeof value === "object" && value !== null;
}

function isNestedContainer(valueType, setting) {
    return (
        (valueType === "CONFIGURABLE" ||
            valueType === "TOGGLEABLE" ||
            valueType === "TOGGLABLE") &&
        Array.isArray(setting.value)
    );
}

function walkSettingTree(setting, moduleName, byType) {
    if (!isObject(setting)) {
        return;
    }

    const valueType =
        typeof setting.valueType === "string"
            ? setting.valueType
            : "<undefined>";

    let row = byType.get(valueType);
    if (row === undefined) {
        row = {
            settingCount: 0,
            modules: new Set(),
        };
        byType.set(valueType, row);
    }

    row.settingCount += 1;
    row.modules.add(moduleName);

    if (isNestedContainer(valueType, setting)) {
        for (const childSetting of setting.value) {
            walkSettingTree(childSetting, moduleName, byType);
        }
    }

    if (valueType === "CHOICE") {
        if (!isObject(setting.choices)) {
            throw new Error(
                `Invalid CHOICE payload in module "${moduleName}": choices is not an object.`,
            );
        }

        for (const choiceSetting of Object.values(setting.choices)) {
            walkSettingTree(choiceSetting, moduleName, byType);
        }
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.json();
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const apiBase = await resolveApiBase(options);

    const modules = await fetchJson(`${apiBase}/client/modules`);
    if (!Array.isArray(modules)) {
        throw new Error("Expected /client/modules to return an array.");
    }

    const byType = new Map();
    const failures = [];

    for (const modulePayload of modules) {
        const moduleName =
            isObject(modulePayload) && typeof modulePayload.name === "string"
                ? modulePayload.name
                : null;

        if (moduleName === null) {
            failures.push({
                moduleName: "<invalid module payload>",
                error: "Missing module name.",
            });
            continue;
        }

        try {
            const rootSetting = await fetchJson(
                `${apiBase}/client/modules/settings?name=${encodeURIComponent(moduleName)}`,
            );
            walkSettingTree(rootSetting, moduleName, byType);
        } catch (error) {
            failures.push({
                moduleName,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    const valueTypes = [...byType.entries()]
        .map(([valueType, row]) => ({
            valueType,
            settingCount: row.settingCount,
            moduleCount: row.modules.size,
            sampleModules: [...row.modules]
                .sort((a, b) => a.localeCompare(b))
                .slice(0, options.sampleSize),
        }))
        .sort((a, b) => a.valueType.localeCompare(b.valueType));

    const summary = {
        moduleCount: modules.length,
        successfulModuleCount: modules.length - failures.length,
        failedModuleCount: failures.length,
        uniqueValueTypeCount: valueTypes.length,
        uniqueValueTypes: valueTypes.map((entry) => entry.valueType),
        valueTypeBreakdown: valueTypes,
        failures,
    };

    console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`scan-runtime-setting-types failed: ${message}`);
    process.exit(1);
});
