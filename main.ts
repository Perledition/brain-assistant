import * as path from "path";

import { Plugin } from "obsidian";

import { AlephAlpha } from "components/aleph_alpha";
import { BrainAssistantPluginSettingTab } from "components/settings";
import { LocalIndex } from "vectra";
import { MarkdownFileReader } from "components/file_reader";
import { VectorDBItem } from "components/interfaces/vector_db_item";
import { estimateRemainingBudget } from "components/budget";
import { DEFAULT_BRAIN_ASSISTANT_SETTINGS, VIEW_TYPE_BRAIN_ASSISTANT } from "global";
import { getBudgetText } from "components/utils";
import { BrainAssistantView } from "components/view";
import { BrainAssistantPluginSettings } from "components/interfaces/setttings";

export let VECTOR_DB: LocalIndex;

export default class BrainAssistantPlugin extends Plugin {
	sidebarIcon: HTMLSpanElement;
	send: number;
	aleph: AlephAlpha;
	content: string[];
	settings: BrainAssistantPluginSettings;
	reader: MarkdownFileReader;

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_BRAIN_ASSISTANT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BrainAssistantPluginSettingTab(this.app, this));

		VECTOR_DB = new LocalIndex(
			path.join(
				`${this.settings.VaultPath}/.obsidian/plugins/brain-assistant/vector/`,
				"..",
				"index"
			)
		);

		
		const item = this.addStatusBarItem();
		const budgetLeft = await estimateRemainingBudget([], this.settings)
		item.createEl("a", {
			text: getBudgetText(budgetLeft),
			href: "",
			attr: {id: "alephAlphaBudget"}
		});

		this.aleph = new AlephAlpha(VECTOR_DB, this.settings);

		this.reader = new MarkdownFileReader(
			this.settings.VaultPath ?? "",
			VECTOR_DB
		);

		if (!(await VECTOR_DB.isIndexCreated())) {
			await VECTOR_DB.createIndex();
		}

		this.updateRoutine();

        // Listen to file modification
        this.app.vault.on("modify", (file) => {
            console.log(`File "${file.path}" has been modified.`);
            this.updateRoutine();
        });

		this.registerView(
			VIEW_TYPE_BRAIN_ASSISTANT,
			(leaf) => new BrainAssistantView(leaf, this.settings, VECTOR_DB)
		);

		this.addRibbonIcon("message-square", "Chat", () => {
			this.activateView();
		});
	}

	async onunload() {}

	async activateView() {
		this.aleph = new AlephAlpha(VECTOR_DB, this.settings);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_BRAIN_ASSISTANT);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_BRAIN_ASSISTANT,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_BRAIN_ASSISTANT)[0]
		);
	}

	private updateRoutine() {
		(async () => {
			const markdownContent = await this.reader.readAllMarkdownFiles();
			if (markdownContent) {
				console.log(markdownContent)
				if (markdownContent.length > 0) {
					const embeddings = await this.aleph.embed(
						markdownContent.map((x) => { 
							if (x.fileContent !== '') {
								return x.fileContent
							} else {
								return 'EMPTY'
							}
						})
					);
					
					let dbContent = markdownContent.map((item, index) => {
						return {
							id: item.id,
							vector: embeddings.embeddings[index],
							metadata: {
								filePath: item.filePath,
								contentHash: item.contentHash,
							},
						};
					});
					this.addItems(dbContent);
				}
			} else {
				console.log("File not found or error occurred.");
			}
		})();		
	}

	async pushVector(item: VectorDBItem) {
		await VECTOR_DB.upsertItem(item);
	}

	async addItems(items: VectorDBItem[]) {
		const updateTag = document.getElementsByClassName("updateDB")[0];
		const inputContainer = document.getElementsByClassName("inputContainer")[0];
		inputContainer.addClass("hide");
		updateTag.removeClass("hide");
		
		for (let i = 0; i < items.length; i++) {
			this.pushVector(items[i]);
		}
		
		await VECTOR_DB.beginUpdate();

		updateTag.addClass("hide");
		inputContainer.removeClass("hide");
	}
}








