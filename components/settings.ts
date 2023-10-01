import { App, PluginSettingTab, Setting } from "obsidian";

import BrainAssistantPlugin from "main";

export class BrainAssistantPluginSettingTab extends PluginSettingTab {
	plugin: BrainAssistantPlugin;

	constructor(app: App, plugin: BrainAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("API Token")
			.setDesc(
				"REQUIRED: Your API Token for aleph alpha. Can be created in your account: https://app.aleph-alpha.com/login"
			)
			.addText((text) =>
				text
					.setPlaceholder("API TOKEN")
					.setValue(this.plugin.settings.Token)
					.onChange(async (value) => {
						this.plugin.settings.Token = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
