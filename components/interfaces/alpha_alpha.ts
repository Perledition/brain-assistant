export interface queryResponse {}

export interface logResponse {}

export interface answerResponse {
	answers: {
		answer: string;
	}[];
}

export interface embeddingResponse {
	model_version: string;
	embedding: number[];
}

export interface embeddingsResponse {
	model_version: string;
	embeddings: [number[]];
}
