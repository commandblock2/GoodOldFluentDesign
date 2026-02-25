import type { ConfigurableSetting } from "../../integration/types";

export type ClickGuiPageType =
    | "clickgui"
    | "quick-settings"
    | "theme-settings"
    | "module";

export interface ClickGuiActivePageState {
    type: ClickGuiPageType;
    moduleName: string | null;
}

export interface ClickGuiPersistedState {
    searchQuery: string;
    selectedCategory: string | null;
    selectedThemeSettings: boolean;
    activeConfigPage: ClickGuiActivePageState;
    activeConfigurable: ConfigurableSetting | null;
    settingsSplitCount: number;
}

let persistedClickGuiState: ClickGuiPersistedState | null = null;

export function getPersistedClickGuiState(): ClickGuiPersistedState | null {
    return persistedClickGuiState;
}

export function setPersistedClickGuiState(state: ClickGuiPersistedState): void {
    persistedClickGuiState = state;
}
