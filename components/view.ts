import { VIEW_TYPE_BRAIN_ASSISTANT } from "global";
import { ItemView, Setting, WorkspaceLeaf } from "obsidian";
import { LocalIndex } from "vectra";
import { handleSend } from "./events";
import { BrainAssistantPluginSettings } from "./interfaces/setttings";


export class BrainAssistantView extends ItemView {
	promptArea: Setting;
	prompt: string;
	settings: BrainAssistantPluginSettings;
	statusBarItem: any
    vectorDB: LocalIndex;

	constructor(leaf: WorkspaceLeaf, settings: BrainAssistantPluginSettings, vectorDB: LocalIndex) {
		super(leaf);
		this.settings = settings;
        this.vectorDB = vectorDB;
	}

	getViewType() {
		return VIEW_TYPE_BRAIN_ASSISTANT;
	}

	getDisplayText() {
		return "Brain Assistant";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		container.createEl("h4", { text: "Brain Assistant" });

		container.createEl("div").innerHTML = `
		<div class="chatWrapper">
			
			<div class="chatWindow">
				<ul class="responseList">
				</ul>
			</div>
			<div class="promptWindow">
				<p class="updateDB hide">The database gets updated, this might take a minute or two</p>
				<div class="inputContainer">
					<textarea class="promptInput" id="promptText" placeholder="What do I know about..."></textarea>
					<button class="sendButton" id="sendPromptButton">
						<svg class="sendIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-fill" viewBox="0 0 16 16">
							<path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
						</svg>
					</button>
				</div>
			</div>
		</div>
		`;

		const settings = this.settings;
        const vectorDBLocal = this.vectorDB;
		container
			.getElementsByClassName("sendButton")[0]
			.addEventListener("click", async function (event) {
				event.preventDefault();
				await handleSend(container, settings, vectorDBLocal);
			});
	}

	async onClose() {
		// Nothing to clean up.
	}
}