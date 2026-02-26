import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let _embeddings = null;
let _llm = null;

export function getEmbeddings() {
    if (!_embeddings) {
        _embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: "gemini-embedding-001",
        });
    }
    return _embeddings;
}

export function getLLM() {
    if (!_llm) {
        _llm = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
            model: "gemini-2.5-flash-lite",
            temperature: 0.3,
            maxRetries: 2,
        });
    }
    return _llm;
}
