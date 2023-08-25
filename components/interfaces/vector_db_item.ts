export interface VectorDBItem {
	id?: string;
	vector: number[];
	metadata: {
		contentHash: string;
		filePath: string;
	};
}
