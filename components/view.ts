import { ItemView, Setting, WorkspaceLeaf } from "obsidian";

import { BrainAssistantPluginSettings } from "./interfaces/setttings";
import { LocalIndex } from "vectra";
import { VIEW_TYPE_BRAIN_ASSISTANT } from "global";
import { handleSend } from "./events";

export class BrainAssistantView extends ItemView {
	promptArea: Setting;
	prompt: string;
	settings: BrainAssistantPluginSettings;
	statusBarItem: any;
	vectorDB: LocalIndex;
	basePath: string;
	configDir: string;

	constructor(
		leaf: WorkspaceLeaf,
		settings: BrainAssistantPluginSettings,
		vectorDB: LocalIndex,
		basePath: string,
		configDir: string
	) {
		super(leaf);
		this.settings = settings;
		this.vectorDB = vectorDB;
		this.basePath = basePath;
		this.configDir = configDir;
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

		// Create a new div element
		const containerDiv = document.createElement("div");
		containerDiv.className = "chatWrapper";

		// Create chat window
		const chatWindowDiv = document.createElement("div");
		chatWindowDiv.className = "chatWindow";

		const responseListUl = document.createElement("ul");
		responseListUl.className = "responseList";
		responseListUl.id = "responseList";

		// Append the ul to the chat window
		chatWindowDiv.appendChild(responseListUl);

		// Create prompt window
		const promptWindowDiv = document.createElement("div");
		promptWindowDiv.className = "promptWindow";

		const updateDBP = document.createElement("p");
		updateDBP.className = "updateDB hide";
		updateDBP.textContent =
			"The database gets updated, this might take a minute or two";

		const inputContainerDiv = document.createElement("div");
		inputContainerDiv.className = "inputContainer";

		const promptTextarea = document.createElement("textarea");
		promptTextarea.className = "promptInput";
		promptTextarea.id = "promptText";
		promptTextarea.placeholder = "What do I know about...";

		const sendButton = document.createElement("button");
		sendButton.className = "sendButton";
		sendButton.id = "sendPromptButton";

		const sendIconSvg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg"
		);
		sendIconSvg.classList.add("sendIcon");
		sendIconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		sendIconSvg.setAttribute("width", "16");
		sendIconSvg.setAttribute("height", "16");
		sendIconSvg.setAttribute("fill", "currentColor");
		sendIconSvg.setAttribute("viewBox", "0 0 16 16");

		const sendIconPath = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path"
		);
		sendIconPath.setAttribute(
			"d",
			"M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"
		);

		// Append all elements to their respective parent elements
		sendIconSvg.appendChild(sendIconPath);
		sendButton.appendChild(sendIconSvg);
		inputContainerDiv.appendChild(promptTextarea);
		inputContainerDiv.appendChild(sendButton);
		promptWindowDiv.appendChild(updateDBP);
		promptWindowDiv.appendChild(inputContainerDiv);
		containerDiv.appendChild(chatWindowDiv);
		containerDiv.appendChild(promptWindowDiv);

		// Append the containerDiv to your desired parent element
		container.appendChild(containerDiv);

		const settings = this.settings;
		const vectorDBLocal = this.vectorDB;
		const basePath = this.basePath;
		const configDir = this.configDir;
		container
			.getElementsByClassName("sendButton")[0]
			.addEventListener("click", async function (event) {
				event.preventDefault();
				await handleSend(
					container,
					settings,
					vectorDBLocal,
					basePath,
					configDir
				);
			});
	}

	async onClose() {
		// Nothing to clean up.
	}
}
