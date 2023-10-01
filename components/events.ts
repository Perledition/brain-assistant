import { AlephAlpha } from "./aleph_alpha";
import { BrainAssistantPluginSettings } from "./interfaces/setttings";
import { LocalIndex } from "vectra";
import { MarkdownFileReader } from "./file_reader";
import { generateUUID } from "./utils";

/**
 * Creates a text Box for a response for a query made by an user
 * @param query original prompt of the user
 * @param RefID UUID as HEX-String as ID for the footer
 * @param AnswerID UUID as HEX-String as ID for the body
 * @returns HTML string for a complete response box
 */
export function createResponseBox(
	query: string,
	RefID: string,
	AnswerID: string
) {
	// Ein <li> Element erstellen
	const listItem = document.createElement("li");
	listItem.className = "responseBox";

	// Ein <div> Element für den Header erstellen
	const headerDiv = document.createElement("div");
	headerDiv.className = "responseBoxHeader";

	// Ein <div> Element für den Text erstellen
	const textDiv = document.createElement("div");
	textDiv.className = "responseBoxHeaderText";

	// Ein <p> Element erstellen und den Text setzen
	const paragraphElement = document.createElement("p");
	paragraphElement.textContent = query;

	// Den Text in das Text-Div einfügen
	textDiv.appendChild(paragraphElement);
	headerDiv.appendChild(textDiv);

	// Den Header in das <li> Element einfügen
	listItem.appendChild(headerDiv);

	// Ein <div> Element für den Body erstellen
	const bodyDiv = document.createElement("div");
	bodyDiv.className = `responseBoxBody responseBoxBody-${AnswerID}`;

	const bodyP = document.createElement("p");
	bodyP.className = AnswerID;

	bodyDiv.appendChild(bodyP);

	// Ein <div> Element für die "typing" Klasse erstellen
	const typingDiv = document.createElement("div");
	typingDiv.className = "typing";
	typingDiv.id = "typing";

	// Drei <span> Elemente für die "typing" Animation erstellen
	for (let i = 0; i < 3; i++) {
		const spanElement = document.createElement("span");
		typingDiv.appendChild(spanElement);
	}

	// Die "typing" Animation in den Body einfügen
	bodyDiv.appendChild(typingDiv);

	// Den Body in das <li> Element einfügen
	listItem.appendChild(bodyDiv);

	// Ein <div> Element für den Footer erstellen
	const footerDiv = document.createElement("div");
	footerDiv.className = `responseBoxFooter ${RefID}`;

	// Den Footer in das <li> Element einfügen
	listItem.appendChild(footerDiv);

	return listItem;
}

/**
 * Function that runs the query entered by an user, creates a response box and fills it with related documents and the response
 * from the aleph alpha api request. Lastly it updates the remaining budget.
 * @param container plugin html element everything is based on
 * @param settings loaded settings from the plugin
 * @param vectorDB vector database for document queries
 */
export async function handleSend(
	container: any,
	settings: BrainAssistantPluginSettings,
	vectorDB: LocalIndex,
	basePath: string,
	configDir: string
): Promise<void> {
	// initialize a file reader for local files, the aleph alpha client and get the query from the input
	const fileReader = new MarkdownFileReader(basePath, vectorDB, configDir);
	const query = container.getElementsByClassName("promptInput")[0].value;
	container.getElementsByClassName("promptInput")[0].value = "";
	let httpClient = new AlephAlpha(vectorDB, settings);

	// generate ID for identification of the box elements the results belog to
	const bodyUUID = generateUUID();
	const footerUUID = generateUUID();

	try {
		// query documents based on  embeddings
		let referenceResult = await httpClient.query(query);
		const reference = referenceResult.map((x) => x.item.metadata.filePath);

		container
			.getElementsByClassName("responseList")[0]
			.appendChild(createResponseBox(query, footerUUID, bodyUUID));

		// read the documents from path as plain text
		const documents = await fileReader.readFilesFromPaths(reference);

		// generate an answer for the q and a
		let answerResult = await httpClient.answer({
			query: query,
			documents: documents,
		});

		// extract results and put them into the response box based on the uuids
		let answer = "🤷🏽‍♀️";
		if (answerResult.answers.length > 0) {
			answer = answerResult.answers[0].answer;
		}

		const bodyDiv = container.getElementsByClassName(bodyUUID)[0];
		bodyDiv.textContent = answer;

		const typingDiv = container.getElementsByClassName(
			`responseBoxBody-${bodyUUID}`
		)[0];
		const loadingSpan = container.getElementsByClassName("typing")[0];
		const footerDiv = container.getElementsByClassName(footerUUID)[0];
		typingDiv.removeChild(loadingSpan);

		reference.forEach((path: string) => {
			const fileName = path.split("/");
			const fileWithoutMd = fileName[fileName.length - 1].split(".");
			const vaultName = basePath.split("/");

			const tag_anchor = container.createEl("a");
			tag_anchor.href = `obsidian://open?vault=${
				vaultName[vaultName.length - 4]
			}&file=${fileWithoutMd[0]}.md`;
			tag_anchor.innerText = fileWithoutMd[0];

			footerDiv.appendChild(tag_anchor);
		});
	} catch (error) {
		console.error("An error occurred:", error);
	}
}
