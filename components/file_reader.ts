import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { LocalIndex } from "vectra";
import { MetaData } from "./interfaces/metadata";

export class MarkdownFileReader {
	basePath: string;
	vectorDB: LocalIndex;

	constructor(basePath: string, vectorDB: LocalIndex) {
		this.basePath = basePath;
		this.vectorDB = vectorDB;
	}

	/**
	 * Reads all markdown files from the given Vault path
	 * @returns returns all needed meta data for the Markdown files not the text it self
	 */
	async readAllMarkdownFiles(): Promise<MetaData[]> {
		try {
			let markdownFiles: MetaData[] = [];
			await this.readMarkdownFilesRecursively(
				this.basePath,
				markdownFiles
			);
			markdownFiles = await this.checkForFileChanges(markdownFiles);
			return markdownFiles;
		} catch (error) {
			console.error("Error reading Markdown files:", error);
			return [];
		}
	}

	/**
	 * Deletes an index item form the vector database by item id
	 * @param ids array of item ids
	 * @returns void
	 */
	async deleteFilesFromIndex(ids: string[]) {
		for (let i = 0; i < ids.length; i++) {
			this.vectorDB.deleteItem(ids[i]);
		}
	}

	/**
	 * based on red file meta data make a check for existing, deleted or updated files
	 * @param markdownFiles array of markdown file meta data
	 * @returns updated markdown file meta data
	 */
	async checkForFileChanges(markdownFiles: MetaData[]): Promise<MetaData[]> {
		const currentIndexedFiles = await this.vectorDB.listItems();
		const idsToDelete = [];
		const filesToIgnore = [];

		// Does a file path still exist? - if not remove it from the index
		const currentPaths: string[] = currentIndexedFiles.map(
			(item: any) => item.metadata.filePath
		);
		const markdownFilesPaths: string[] = markdownFiles.map(
			(item: any) => item.filePath
		);
		const currentHashes: string[] = currentIndexedFiles.map(
			(item: any) => item.metadata.contentHash
		);

		for (let i = 0; i < currentPaths.length; i++) {
			if (!markdownFilesPaths.includes(currentPaths[i])) {
				idsToDelete.push(currentIndexedFiles[i].id);
			} else {
				// Has the hash value changed? - if so create a new embedding and update the vector entry
				const markdownFilesRelevantIndex = markdownFilesPaths.indexOf(
					currentPaths[i]
				);
				const markdownFileHash =
					markdownFiles[markdownFilesRelevantIndex].contentHash;
				
				if (markdownFileHash !== currentHashes[i]) {
					markdownFiles[markdownFilesRelevantIndex].id =
						currentIndexedFiles[i].id;
				} else {
					// it is an existing path with the same hash? - then ignore the file
					filesToIgnore.push(markdownFilesRelevantIndex);
				}
			}
		}

		// Sort indexes in descending order so that removing items doesn't affect the subsequent indexes
		filesToIgnore.sort((a, b) => b - a);

		for (const index of filesToIgnore) {
			markdownFiles = markdownFiles.splice(index, 1);
		}

		await this.deleteFilesFromIndex(idsToDelete);
		return markdownFiles;
	}

	/**
	 * creates a hash value for a given string
	 * @param content string content to be hashed
	 * @returns hash value for the content
	 */
	private createContentHash(content: string): string {
		// Create a hash object
		const hash = crypto.createHash("sha256");
		hash.update(content);
		const hashValue = hash.digest("hex");
		return hashValue;
	}

	/**
	 * removes special characters from a given text
	 * @param markdownContent string content to be cleaned
	 * @returns text without special characters
	 */
	private removeSpecialCharacters(markdownContent: string) {
		// Define a regular expression to match special characters
		const specialCharsRegex = /[*#$%^&*()_+=\[\]{};':"\\|,.<>\/]+/g;

		// Replace special characters with an empty string
		const cleanedContent = markdownContent.replace(specialCharsRegex, "");
		const cleanedContent2 = cleanedContent.replace("\\n", " ");
		return cleanedContent2;
	}

	/**
	 * Takes a list of file paths and reads them in
	 * @param paths list of file paths
	 * @returns a list of text for each file path
	 */
	async readFilesFromPaths(paths: any[]): Promise<{ text: string }[]> {
		let documents = [];
		for (const path of paths) {
			let fileContent = await fs.promises.readFile(path, "utf-8");
			documents.push({ text: this.removeSpecialCharacters(fileContent) });
		}
		return documents;
	}

	/**
	 * Takes a path and reads all markdown files in that folder or subfolders
	 * @param directoryPath main path to read file from
	 * @param markdownFiles list of file meta data
	 * @returns a list of text for each file path
	 */
	private async readMarkdownFilesRecursively(
		directoryPath: string,
		markdownFiles: MetaData[]
	) {
		const files = await fs.promises.readdir(directoryPath);
		for (const file of files) {
			if (!directoryPath.includes(".obsidian")) {
				const filePath = path.join(directoryPath, file);
				const stat = await fs.promises.stat(filePath);

				if (stat.isDirectory()) {
					await this.readMarkdownFilesRecursively(
						filePath,
						markdownFiles
					);
				} else if (
					stat.isFile() &&
					path.extname(file).toLowerCase() === ".md"
				) {
					const fileContent = await fs.promises.readFile(
						filePath,
						"utf-8"
					);

					markdownFiles.push({
						fileContent: this.removeSpecialCharacters(fileContent),
						contentHash: this.createContentHash(fileContent),
						filePath: filePath,
					});
				}
			}
		}
	}
}
