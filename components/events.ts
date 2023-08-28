import { LocalIndex } from "vectra";
import { AlephAlpha } from "./aleph_alpha";
import { estimateRemainingBudget } from "./budget";
import { MarkdownFileReader } from "./file_reader";
import { generateUUID, getBudgetText } from "./utils";
import { BrainAssistantPluginSettings } from "./interfaces/setttings";


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
	return `
		<li class="responseBox">
		<div class="responseBoxHeader">
			<div class="responseBoxHeaderIcon">
				<svg class="sendIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stars" viewBox="0 0 16 16">
					<path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z"/>
				</svg>
			</div>
			<div class="responseBoxHeaderText">
				<p>${query}</p>
			</div>
		</div>
		<div class="responseBoxBody">
			<div class=${AnswerID}>
				<div class="typing">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		</div>
		<div class="responseBoxFooter">
			<div class=${RefID}>
			
			</div>
	</li>
	`;
}

/**
 * Function that runs the query entered by an user, creates a response box and fills it with related documents and the response
 * from the aleph alpha api request. Lastly it updates the remaining budget.
 * @param container plugin html element everything is based on
 * @param settings loaded settings from the plugin
 * @param vectorDB vector database for document queries
 * @returns void
 */
export async function handleSend(
	container: any,
	settings: BrainAssistantPluginSettings,
	vectorDB: LocalIndex
) {

	// initialize a file reader for local files, the aleph alpha client and get the query from the input
	const fileReader = new MarkdownFileReader(settings.VaultPath, vectorDB);
	const query = container.getElementsByClassName("promptInput")[0].value;
	container.getElementsByClassName("promptInput")[0].value = "";
	let httpClient = new AlephAlpha(vectorDB, settings);

	// generate ID for identification of the box elements the results belog to
	const bodyUUID = generateUUID();
	const footerUUID = generateUUID();

	try {

		// query documents based on stored embeddings
		let referenceResult = await httpClient.query(query);
		const reference = referenceResult.map((x) => x.item.metadata.filePath);
		container.getElementsByClassName("responseList")[0].innerHTML +=
			createResponseBox(query, footerUUID, bodyUUID);

		// read the documents from path as plain text
		const documents = await fileReader.readFilesFromPaths(reference);
		const referenceTags = reference.map((path: string) => {
			let fileName = path.split("/");
			let fileWithoutMd = fileName[fileName.length - 1].split(".");
			const vaultName = settings.VaultPath.split("/");
			return `<a href="obsidian://open?vault=${
				vaultName[vaultName.length - 1]
			}&file=${fileWithoutMd[0]}">${fileWithoutMd[0]}</a>`;
		});

		// generate an answer for the q and a
		let answerResult = await httpClient.answer({
			query: query,
			documents: documents,
		});

		// extract results and put them into the response box based on the uuids
		let answer = '🤷🏽‍♀️';
		console.log(answerResult.answers, answerResult.answers.length)
		if(answerResult.answers.length > 0) {
			answer = answerResult.answers[0].answer;
		}

		
		container.getElementsByClassName(
			bodyUUID
		)[0].innerHTML = `<p>${answer}</p>`;

		container.getElementsByClassName(
			footerUUID
		)[0].innerHTML = `<p>${referenceTags.join(", ")}</p>`;

		// request the last logs from alpeh alpha for the budget estimate
		const spends = await httpClient.requestSpend();
		
		// update the budget in the status bar
		let budgetLeft = await estimateRemainingBudget(spends, settings)
		const budgetLeftText = getBudgetText(budgetLeft);
		const budgetTag = (document.getElementById("alephAlphaBudget") as HTMLElement)
		budgetTag.innerText = budgetLeftText;

	} catch (error) {
		console.error("An error occurred:", error);
	}
}