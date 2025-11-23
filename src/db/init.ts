import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";

import schemaSQL from "./schema.sql?raw";

let dbInstance: PGlite | null = null;

export async function initDB(): Promise<PGlite> {
    if (dbInstance) return dbInstance;

    // Initialize PGlite with IndexedDB storage and vector extension
    dbInstance = await PGlite.create({
        dataDir: 'idb://billy-db',
        relaxedDurability: true,
        extensions: { vector }
    });

    // Execute schema
    await dbInstance.exec(schemaSQL);
    console.log("✅ Database initialized");

    return dbInstance;
}

export function getDB(): PGlite {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call initDB() first.");
    }
    return dbInstance;
}