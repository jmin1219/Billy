interface SimilarTask {
    id: string;
    title: string;
    similarity: number;
    position_x: number;
    position_y: number;
}

export async function calculateSmartPosition(
    taskId: string,
    db: any
): Promise<{ x: number; y: number }> {
    console.log('🎯 calculateSmartPosition called for task:', taskId);

    const result = await db.query(`
        SELECT
            n.id,
            n.title,
            n.position_x,
            n.position_y,
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
    `, [taskId, 0.7, 5]);
    console.log('📊 Similar tasks found:', result.rows.length);

    // If no similar tasks, place randomly in center area
    if (result.rows.length === 0) {
        const pos = {
            x: 250 + (Math.random() - 0.5) * 400,
            y: 250 + (Math.random() - 0.5) * 400
        };
        console.log('📍 Final position:', Math.round(pos.x), Math.round(pos.y));
        return pos;
    }

    // Calculate centroid of similar tasks
    const similarTasks = result.rows as SimilarTask[];
    const centroid = {
        x: similarTasks.reduce((sum, t) => sum + t.position_x, 0) / similarTasks.length,
        y: similarTasks.reduce((sum, t) => sum + t.position_y, 0) / similarTasks.length
    };

    // Add small random offset to prevent exact overlap
    const pos = {
        x: centroid.x + (Math.random() - 0.5) * 200,
        y: centroid.y + (Math.random() - 0.5) * 200
    };
    console.log('📍 Centroid:', Math.round(centroid.x), Math.round(centroid.y));
    console.log('📍 Final position:', Math.round(pos.x), Math.round(pos.y));
    return pos;
}