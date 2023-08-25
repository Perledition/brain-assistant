interface BrainAssistantPluginSettings {
	Token: string;
	Budget: number;
	VaultPath: string;
}

interface AlephAlphaLog {
	create_timestamp: string;
	model_name: string;
	request_type: string;
	token_count_prompt: number;
	image_count_prompt: number;
	token_count_completion: number;
	duration_millis: number;
	credits: number;
}

interface BudgetLogData {
	budgetDate: string;
	logs: AlephAlphaLog[];
}