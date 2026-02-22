import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSettingEntryRowKey } from "../src/routes/clickgui/setting/settingEntryKey.js";

const scaffoldExactPayload = JSON.parse(
    readFileSync(new URL("./fixtures/scaffold.exact.json", import.meta.url), "utf8"),
);

test("getSettingEntryRowKey avoids duplicate keys for repeated backend key values", () => {
    const first = getSettingEntryRowKey(
        {
            name: "ShowTags",
            key: "liquidbounce.module.hud.themes.liquidbounce.components.arrayList.showTags",
        },
        1,
    );
    const second = getSettingEntryRowKey(
        {
            name: "ShowTags",
            key: "liquidbounce.module.hud.themes.liquidbounce.components.arrayList.showTags",
        },
        4,
    );

    assert.notEqual(first, second);
    assert.equal(
        first,
        "liquidbounce.module.hud.themes.liquidbounce.components.arrayList.showTags-1",
    );
    assert.equal(
        second,
        "liquidbounce.module.hud.themes.liquidbounce.components.arrayList.showTags-4",
    );
});

test("getSettingEntryRowKey falls back to setting name when key is missing", () => {
    const result = getSettingEntryRowKey(
        {
            name: "Renderer",
            key: undefined,
        },
        2,
    );

    assert.equal(result, "Renderer-2");
});

function assertUniqueSiblingKeys(settings, contextPath = "root") {
    const rowKeys = settings.map((setting, index) =>
        getSettingEntryRowKey(setting, index),
    );

    assert.equal(
        new Set(rowKeys).size,
        rowKeys.length,
        `Duplicate generated row key at ${contextPath}`,
    );

    for (const setting of settings) {
        if (!setting || typeof setting !== "object") {
            continue;
        }

        const valueType =
            typeof setting.valueType === "string"
                ? setting.valueType.toUpperCase()
                : "";

        if (
            (valueType === "CONFIGURABLE" ||
                valueType === "TOGGLABLE" ||
                valueType === "TOGGLEABLE") &&
            Array.isArray(setting.value)
        ) {
            assertUniqueSiblingKeys(
                setting.value,
                `${contextPath}.${setting.name}`,
            );
        }

        if (
            valueType === "CHOICE" &&
            setting.choices &&
            typeof setting.choices === "object"
        ) {
            for (const [choiceName, choiceSetting] of Object.entries(
                setting.choices,
            )) {
                if (
                    choiceSetting &&
                    typeof choiceSetting === "object" &&
                    Array.isArray(choiceSetting.value)
                ) {
                    assertUniqueSiblingKeys(
                        choiceSetting.value,
                        `${contextPath}.${setting.name}.choices.${choiceName}`,
                    );
                }
            }
        }
    }
}

test("exact scaffold payload keeps generated sibling row keys collision-free", () => {
    assert.equal(scaffoldExactPayload.name, "Scaffold");
    assert.equal(scaffoldExactPayload.valueType, "TOGGLEABLE");
    assert.ok(Array.isArray(scaffoldExactPayload.value));

    assertUniqueSiblingKeys(scaffoldExactPayload.value, "Scaffold");
});
