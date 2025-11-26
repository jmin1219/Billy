import { getDB } from "./init";

export async function findSimilarTasks(
    taskId: string,
    threshold: number = 0.85,
    limit: number = 5
): Promise<{
    id: string;
    title: string;
    similarity: number;
}[]> {
    const db = getDB();
    const result = await db.query(`
        SELECT 
            n.id,
            n.title,
            n.status,
            1 - (e1.embedding <=> e2.embedding) AS similarity
        FROM nodes n
        JOIN embeddings e1 ON n.id = e1.node_id
        CROSS JOIN embeddings e2
        WHERE e2.node_id = $1
            AND n.id != $1
            AND n.status != 'done'
            AND (1 - (e1.embedding <=> e2.embedding)) >= $2
        ORDER BY e1.embedding <=> e2.embedding ASC
        LIMIT $3
    `, [taskId, threshold, limit]);
    
    return result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        similarity: row.similarity
    }));
}