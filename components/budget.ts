import * as fs from "fs";

import {
	AlephAlphaLog,
	BrainAssistantPluginSettings,
	BudgetLogData,
} from "./interfaces/setttings";

import { compareDates } from "./utils";

/**
 * Writes the date time "now" to log_data.json as orientation point for budget estimatimation
 * @returns void
 */
export function writeFixPointToDisk(basePath: string): void {
	const isoDate = new Date().toISOString();
	let data = { budgetDate: isoDate, logs: [] };

	fs.writeFile(
		`${basePath}/log_data.json`,
		JSON.stringify(data, null, 2),
		"utf8",
		(err) => {
			if (err) {
				console.error("Error writing to log_data.json:", err);
			} else {
				console.info("Value updated and saved successfully.");
			}
		}
	);
}

/**
 * Takes an array of aleph alpha logs and writes it to log_data.json for future budget estimation
 * @param log_array array of logs provided from aleph alpha requests
 * @param settings obsidian plugin settings including VaultPath
 * @returns void
 */
export function writeSpendToDisk(
	log_array: BudgetLogData,
	basePath: string
): void {
	// Write the updated data back to the file
	fs.writeFile(
		`${basePath}/log_data.json`,
		JSON.stringify(log_array, null, 2),
		"utf8",
		(err) => {
			if (err) {
				console.error("Error writing to log_data.json:", err);
			} else {
				console.info("Value updated and saved successfully.");
			}
		}
	);
}

/**
 * Loads the data from log_data.json as object
 * @param settings obsidian plugin settings including VaultPath
 * @returns log_data
 */
async function loadSpendFromDisk(basePath: string): Promise<BudgetLogData> {
	return new Promise((resolve, reject) => {
		fs.readFile(`${basePath}/log_data.json`, "utf8", (err, data) => {
			if (err) {
				reject(err);
				return;
			}

			try {
				const jsonData = JSON.parse(data);
				resolve(jsonData);
			} catch (parseError) {
				reject(parseError);
			}
		});
	});
}

/**
 * Takes an array of type aleph alpha log and removes duplicated entities
 * @param arr array of logs provided from aleph alpha requests
 * @returns array with unique enitites
 */
export function removeDuplicates(arr: AlephAlphaLog[]): AlephAlphaLog[] {
	const uniqueEntries = [];
	const seenEntries = new Set();

	for (const entry of arr) {
		const entryString = JSON.stringify(entry);

		if (!seenEntries.has(entryString)) {
			seenEntries.add(entryString);
			uniqueEntries.push(entry);
		}
	}
	return uniqueEntries;
}

/**
 * Takes an array of aleph alpha logs updates the current log_data.json file for future budget estimation and calculates the current budget left
 * @param requestedLogs array of logs provided from aleph alpha requests
 * @param settings obsidian plugin settings including VaultPath
 * @returns estimated number of credit budget left to account
 */
export async function estimateRemainingBudget(
	requestedLogs: any,
	settings: BrainAssistantPluginSettings,
	basePath: string
): Promise<number> {
	// load spend tracking from disk
	let existingData = await loadSpendFromDisk(basePath)
		.then((jsonData: BudgetLogData): BudgetLogData => {
			return jsonData;
		})
		.catch((error): BudgetLogData => {
			console.error("Error reading JSON file:", error);
			return { budgetDate: "", logs: [] };
		});

	// concat arrays
	let harmonizedLogs: AlephAlphaLog[] = requestedLogs.concat(
		existingData["logs"]
	);

	// remove duplicates and write the data back to log_data.json
	harmonizedLogs = removeDuplicates(harmonizedLogs);
	existingData["logs"] = harmonizedLogs;
	writeSpendToDisk(existingData, basePath);

	// sum values if the log was created after the budget value from the settings was changed
	let spend = [0];
	try {
		const fixPoint = existingData.budgetDate;
		spend = harmonizedLogs.map((log: any) => {
			if (compareDates(fixPoint, log.create_timestamp)) {
				return log.credits;
			} else {
				return 0;
			}
		});
	} catch {
		console.error("could not find credits");
	}
	const sum = spend.reduce((sum, value) => sum + value, 0);

	// substract from setting set budget
	const budget: number = parseFloat(
		settings.Budget.toString().replace(",", ".")
	);
	const budgetLeft = Math.floor(budget) - sum;

	return budgetLeft;
}
