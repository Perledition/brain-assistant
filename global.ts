import { BrainAssistantPluginSettings } from "components/interfaces/setttings";

export const VIEW_TYPE_BRAIN_ASSISTANT = "brain-assistant-view";

export const DEFAULT_BRAIN_ASSISTANT_SETTINGS: Partial<BrainAssistantPluginSettings> =
	{
		Token: "",
		Budget: 0,
		VaultPath: "/home/user/Obsidian",
	};