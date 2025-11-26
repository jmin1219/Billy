import { pipeline } from "@huggingface/transformers";

let embeddingPipeline: any = null;  // Global variable to store the embedding pipeline (singleton)
// Singleton pattern allows "lazy initialization" (load expensive model only once, reuse across app)

export async function initEmbeddingModel() {
    if (embeddingPipeline) return embeddingPipeline;  // Check if already loaded
    
    // Load the model (downloads 23MB first time, cached after)
    embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
    );

    console.log('✅ Embedding model loaded');
    return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    const model = await initEmbeddingModel();
    const result = await model(text, { pooling: 'mean', normalize: true });

    // Convert tensor to plain array
    return Array.from(result.data);
}

export async function generateContentHash(text: string): Promise<string> {
    // Create a unique fingerprint of the text. Changed text will yield different hash
    const encoder = new TextEncoder();
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveEmbedding(
    db: any,
    nodeId: string,
    text: string,
): Promise<void> {
    try {
        const embedding = await generateEmbedding(text);
        const contentHash = await generateContentHash(text);

        // pgvector expected array format: [1,2,3] not "[1, 2, 3]"
        const vectorString = `[${embedding.join(',')}]`;

        await db.query(
            'INSERT INTO embeddings (node_id, content_hash, embedding) VALUES ($1, $2, $3) ON CONFLICT (node_id) DO UPDATE SET content_hash = $2, embedding = $3',
            [nodeId, contentHash, vectorString]
        );
        console.log('✅ Embedding saved for task', nodeId);
    } catch (error) {
        console.error('Error saving embedding:', error);
    }
}