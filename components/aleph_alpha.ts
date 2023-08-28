import { LocalIndex, MetadataTypes, QueryResult } from "vectra";
import { answerResponse, embeddingReponse, embeddingsReponse } from "./interfaces/alpha_alpha";
import { AlephAlphaLog, BrainAssistantPluginSettings } from "./interfaces/setttings";

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
	async embed(text: string[]): Promise<embeddingsReponse> {
		const axios = require("axios");
		let data = JSON.stringify({
			model: "luminous-base",
			prompts: text,
			representation: "symmetric",
			compress_to_size: 128,
		});

		let config = {
			method: "post",
			maxBodyLength: Infinity,
			url: this.baseUrl + "/batch_semantic_embed",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			data: data,
		};

		let result = await axios(config)
			.then((response: any) => response.data)
			.then((response: embeddingsReponse) => {
				return response;
			})
			.catch((error: any) => {
				console.log(error);
				return { model_version: "error", embeddings: [[]] };
			});
		return result;
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
		const axios = require("axios");
		let data = JSON.stringify(setup);

		let config = {
			method: "post",
			maxBodyLength: Infinity,
			url: this.baseUrl + "/qa",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			data: data,
		};

		let result = await axios(config)
			.then((response: any) => response.data)
			.then((response: answerResponse) => {
				return response;
			})
			.catch((error: any) => {
				console.log(`Found Error in generating aleph alpha answer: ${error}`);
				return {answers: [{answer: "no answer could be generated. Error in Request"}]};
			});
		return result;
	}

	/**
	 * Returns the last 10 logs from aleph alpha
	 * @returns an array of log data from aleph alpha
	 */
	async requestSpend(): Promise<AlephAlphaLog[]> {
		const axios = require("axios");

		let config = {
			method: "get",
			maxBodyLength: Infinity,
			url: "https://api.aleph-alpha.com/users/me/requests",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
		};

		let result = await axios(config)
			.then((response: any) => {
				return response.data;
			})
			.catch((error: any) => {
				console.log(error);
				return [];
			});
		
		return result
	}

	/**
	 * Takes a path and reads all markdown files in that folder or subfolders
	 * @param text question to be answered
	 * @returns a list of vector items that matches the text the most
	 */
	async query(
		text: string
	): Promise<QueryResult<Record<string, MetadataTypes>>[]> {
		const axios = require("axios");
		let data = JSON.stringify({
			model: "luminous-base",
			prompt: text,
			representation: "symmetric",
			compress_to_size: 128,
		});

		let config = {
			method: "post",
			maxBodyLength: Infinity,
			url: "https://api.aleph-alpha.com/semantic_embed",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${this.settings.Token}`,
			},
			data: data,
		};

		let result = await axios(config)
			.then((response: any) => response.data)
			.then((response: embeddingReponse) => {
				return response;
			})
			.catch((error: any) => {
				console.log(`Found Error in quering the best documents: ${error}`);
				return {answers: [{answer: "no answer could be generated. Error in Request"}]};
			});

		const documentResults = await this.vectorDB.queryItems(
			result.embedding,
			3
		);

		if (documentResults.length > 0) {
			return documentResults;
		} else {
			return [];
		}
	}
}
