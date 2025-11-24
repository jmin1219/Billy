-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Tasks/nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  interest INTEGER CHECK (interest BETWEEN 1 AND 5),
  time_estimate INTEGER, -- in minutes
  context JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(384), -- MiniLM-L6-v2 produces 384-dim vectors
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships between nodes (dependencies, etc.)
CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  edge_type TEXT DEFAULT 'dependency',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_embeddings_node_id ON embeddings(node_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
