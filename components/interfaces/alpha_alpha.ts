export interface queryResponse {}

export interface logResponse{}

export interface answerResponse {
    answers: {
        answer: string;
    }[]
}

export interface embeddingReponse{
    model_version: string;
    embeddings: number[]; 
}


export interface embeddingsReponse{
    model_version: string;
    embeddings: [number[]] 
}
