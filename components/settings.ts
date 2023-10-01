import { App, PluginSettingTab, Setting } from "obsidian";

import BrainAssistantPlugin from "main";
import { writeFixPointToDisk } from "./budget";

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

		new Setting(containerEl)
			.setName("Budget")
			.setDesc(
				"OPTIONAL: If you know your Credit Budget you can enter it here to have a better spend overview"
			)
			.addText((text) =>
				text
					.setPlaceholder("0")
					.setValue(this.plugin.settings.Budget.toString())
					.onChange(async (value) => {
						// add a datetime to log_data.json, so it considers only data from this date on and ignores all other dates
						// writeFixPointToDisk(settings)
						this.plugin.settings.Budget = parseInt(
							value.toString()
						);
						await this.plugin.saveSettings();
					})
			);
	}
}
