// @ts-check

/**
 * @typedef {{
 *   key?: string | undefined;
 *   name: string;
 * }} SettingLike
 */

/**
 * Generates a unique key for sibling setting rows.
 *
 * Backend payloads can contain duplicate `setting.key` values.
 * We keep the semantic key/name and append the sibling index to guarantee
 * uniqueness for Svelte keyed each blocks.
 *
 * @param {SettingLike} setting
 * @param {number} childIndex
 */
export function getSettingEntryRowKey(setting, childIndex) {
    const candidateKey =
        typeof setting.key === "string" && setting.key.trim().length > 0
            ? setting.key
            : setting.name;

    return `${candidateKey}-${childIndex}`;
}

