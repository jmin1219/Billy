import { live, PGliteWithLive } from "@electric-sql/pglite/live";
import { vector } from "@electric-sql/pglite/vector";
import { PGlite } from "@electric-sql/pglite";

import schemaSQL from "./schema.sql?raw";

let dbInstance: PGliteWithLive | null = null;

export async function initDB(): Promise<PGliteWithLive> {
    if (dbInstance) return dbInstance;

    // Initialize PGlite with IndexedDB storage and vector extension
    dbInstance = await PGlite.create({
        dataDir: 'idb://billy-db',
        relaxedDurability: true,
        extensions: { vector, live }
    });

    // Execute schema
    await dbInstance.exec(schemaSQL);
    console.log("✅ Database initialized");

    return dbInstance;
}

export function getDB(): PGliteWithLive {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call initDB() first.");
    }   
    return dbInstance;
}