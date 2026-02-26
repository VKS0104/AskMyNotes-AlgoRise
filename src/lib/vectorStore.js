import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getEmbeddings } from "./gemini.js";

const COLLECTION_NAME = "subject_notes";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

let vectorStoreInstance = null;

export async function getVectorStore() {
    if (!vectorStoreInstance) {
        const embeddings = getEmbeddings();
        try {
            vectorStoreInstance = await Chroma.fromExistingCollection(embeddings, {
                collectionName: COLLECTION_NAME,
                url: CHROMA_URL,
                collectionMetadata: { "hnsw:space": "cosine" },
            });
        } catch {
            // Collection doesn't exist yet — create it with an empty set
            vectorStoreInstance = new Chroma(embeddings, {
                collectionName: COLLECTION_NAME,
                url: CHROMA_URL,
                collectionMetadata: { "hnsw:space": "cosine" },
            });
            await vectorStoreInstance.ensureCollection();
        }
    }
    return vectorStoreInstance;
}

export async function addDocuments(documents) {
    const store = await getVectorStore();
    await store.addDocuments(documents);
    return store;
}
