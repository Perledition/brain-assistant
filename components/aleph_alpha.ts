import {
	AlephAlphaLog,
	BrainAssistantPluginSettings,
} from "./interfaces/setttings";
import { LocalIndex, MetadataTypes, QueryResult } from "vectra";
import {
	answerResponse,
	embeddingResponse,
	embeddingsResponse,
} from "./interfaces/alpha_alpha";

import fetch from "node-fetch";

export class AlephAlpha {
	baseUrl: string;
	vectorDB: LocalIndex;
	settings: BrainAssistantPluginSettings;

	constructor(vectorDB: LocalIndex, settings: BrainAssistantPluginSettings) {
		this.baseUrl = "https://api.aleph-alpha.com";
		this.vectorDB = vectorDB;
		this.settings = settings;
	}

	/**
	 * Takes a list of text an creates an embedding for each text element in the list
	 * @param text array with text
	 * @returns embeedings for each text in size 128
	 */
	async embed(text: string[]): Promise<embeddingsResponse> {
		const data = JSON.stringify({
			model: "luminous-base",
			prompts: text,
			representation: "symmetric",
			compress_to_size: 128,
		});

		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			body: data,
		};

		try {
			const response = await fetch(
				`${this.baseUrl}/batch_semantic_embed`,
				requestOptions
			);

			if (!response.ok) {
				throw new Error(
					`Request failed with status: ${response.status}`
				);
			}

			const responseData: embeddingsResponse = await response.json();
			return responseData;
		} catch (error) {
			console.error(error);
			return { model_version: "error", embeddings: [[]] };
		}
	}

	/**
	 * Takes a setup of a query and related documents in an array and generates an answer
	 * @param setup object containing a query and related documents - all in string
	 * @param markdownFiles list of file meta data
	 * @returns an answer to the query based on the documents
	 */
	async answer(setup: {
		query: string;
		documents: { text: string }[];
	}): Promise<answerResponse> {
		const data = JSON.stringify(setup);

		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			body: data,
		};

		try {
			const response = await fetch(`${this.baseUrl}/qa`, requestOptions);

			if (!response.ok) {
				throw new Error(
					`Request failed with status: ${response.status}`
				);
			}

			const responseData: answerResponse = await response.json();
			return responseData;
		} catch (error) {
			console.error(
				`Found Error in generating aleph alpha answer: ${error}`
			);
			return {
				answers: [
					{
						answer: "no answer could be generated. Error in Request",
					},
				],
			};
		}
	}

	/**
	 * Returns the last 10 logs from aleph alpha
	 * @returns an array of log data from aleph alpha
	 */
	async requestSpend(): Promise<AlephAlphaLog[]> {
		const requestOptions = {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
		};

		try {
			const response = await fetch(
				"https://api.aleph-alpha.com/users/me/requests",
				requestOptions
			);

			if (!response.ok) {
				throw new Error(
					`Request failed with status: ${response.status}`
				);
			}

			const responseData: AlephAlphaLog[] = await response.json();
			return responseData;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	/**
	 * Takes a path and reads all markdown files in that folder or subfolders
	 * @param text question to be answered
	 * @returns a list of vector items that matches the text the most
	 */
	async query(
		text: string
	): Promise<QueryResult<Record<string, MetadataTypes>>[]> {
		const data = JSON.stringify({
			model: "luminous-base",
			prompt: text,
			representation: "symmetric",
			compress_to_size: 128,
		});

		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			body: data,
		};
		console.log(this.vectorDB.listItems());
		try {
			const response = await fetch(
				"https://api.aleph-alpha.com/semantic_embed",
				requestOptions
			);

			if (!response.ok) {
				throw new Error(
					`Request failed with status: ${response.status}`
				);
			}

			const responseData: embeddingResponse = await response.json();

			const documentResults = await this.vectorDB.queryItems(
				responseData.embedding,
				3
			);
			console.log("items");
			console.log(this.vectorDB.listItems());
			console.log(documentResults);
			if (documentResults.length !== undefined) {
				return documentResults;
			} else {
				return [];
			}
		} catch (error) {
			console.error(
				`Found Error in querying the best documents: ${error}`
			);
			return [];
		}
	}
}
