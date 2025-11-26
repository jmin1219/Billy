import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  OnNodesChange,
  applyNodeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TaskNode from './components/TaskNode';
import { getDB } from './db/init';
import TaskForm from './components/TaskForm';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { saveEmbedding } from './ai/embeddings';
import { findSimilarTasks } from './db/similarity';
import toast, { Toaster } from 'react-hot-toast';
import { calculateSmartPosition } from './algorithms/auto-layout';

const nodeTypes = {
  task: TaskNode
};

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isModalOpen = selectedTask !== null || isCreating;

  const handleEditNode = useCallback((nodeData: any) => {
    setSelectedTask({
      id: nodeData.id,
      title: nodeData.title,
      energy: nodeData.energy,
      interest: nodeData.interest,
      time_estimate: nodeData.time_estimate ?? 0
    });
  }, []);  // Empty dependency array ensures this runs only once and function never changes

  // Subscribe to tasks query
  const result = useLiveQuery(
    `SELECT id, title, energy, interest, time_estimate, status, position_x, position_y FROM nodes`,
    []
  );

  const flowNodes = useMemo(() => {
    if (!result?.rows) return [];

    return result.rows.map((row: any) => ({
      id: row.id,
      type: 'task',
      position: {
        x: row.position_x ?? 100,
        y: row.position_y ?? 100
      },
      data: {
        title: row.title,
        energy: row.energy,
        interest: row.interest,
        time_estimate: row.time_estimate,
        status: row.status,
      },
    }))
  }, [result?.rows]);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !isModalOpen) {
        handleDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const handleCreateTask = async (data: any) => {
    const db = getDB();
    
    // 1. Insert task to DB with temporary random position
    const result = await db.query(`
      INSERT INTO nodes (title, energy, interest, time_estimate, position_x, position_y)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [data.title, data.energy, data.interest, data.time_estimate, Math.random() * 500, Math.random() * 500]);

    const taskId = (result.rows[0] as any).id;
    
    // 2. Generate embedding + smart positioning + duplicate check in background (fire-and-forget)
    saveEmbedding(db, taskId, data.title)
      .then(async () => {
        console.log('✅ Embedding saved for task:', taskId);
        
        // DEBUG: Check ALL embeddings
        const allEmb = await db.query('SELECT node_id, content_hash FROM embeddings');
        console.log('📊 Total embeddings in DB:', allEmb.rows.length);
        console.log('📋 All embeddings:', allEmb.rows);
        
        // Calculate smart position based on similarity
        const smartPos = await calculateSmartPosition(taskId, db);
        
        // Update position in DB
        await db.query(`
          UPDATE nodes
          SET position_x = $1, position_y = $2
          WHERE id = $3
        `, [smartPos.x, smartPos.y, taskId]);
        
        console.log('📍 Position updated to:', Math.round(smartPos.x), Math.round(smartPos.y));
        
        // Check for duplicates
        console.log('🔍 Checking for duplicates...');
        const similar = await findSimilarTasks(taskId, 0.85, 5);
        console.log('📋 Found', similar.length, 'similar tasks');

        if (similar.length > 0) {
          console.log('🚨 Showing toast for:', similar[0].title);
          toast(`⚠️ Similar task found: "${similar[0].title}" (${Math.round(similar[0].similarity * 100)}% match)`);
        } else {
          console.log('✅ No duplicates found');
        }
        const embCheck = await db.query(`
          SELECT 
            node_id, 
            content_hash,
            embedding::text as emb_text,
            pg_typeof(embedding) as emb_type
          FROM embeddings 
          WHERE node_id = $1
        `, [taskId]);
        console.log('🔍 Embedding data:', embCheck.rows[0]);

        const vectorTest = await db.query(`
          SELECT 
            e1.node_id as id1,
            e2.node_id as id2,
            e1.embedding <=> e2.embedding as distance
          FROM embeddings e1, embeddings e2
          WHERE e1.node_id != e2.node_id
          LIMIT 5
      `);
      console.log('🧪 Vector operator test:', vectorTest.rows); 
      })
      .catch(err => {
        console.error('❌ Error in embedding/positioning:', err);
      });
    setIsCreating(false);
    setSelectedTask(null);
  }

  const handleUpdateTask = async (data: any) => {
    const db = getDB();
    
    await db.query(`
      UPDATE nodes
      SET title = $1, energy = $2, interest = $3, time_estimate = $4
      WHERE id = $5
    `, [data.title, data.energy, data.interest, data.time_estimate, selectedTask.id]);

    // Regenerate embedding if title changed
    saveEmbedding(db, selectedTask.id, data.title).catch(err => console.error('Error generating embedding:', err));

    setIsCreating(false);
    setSelectedTask(null);
  }

  const handleToggleTaskStatus = async (nodeId: string) => {
    const db = getDB();
    const result = await db.query(`
      SELECT status FROM nodes WHERE id = $1
    `, [nodeId]);
    const currentStatus = (result.rows[0] as any)?.status || 'todo';
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await db.query(`
      UPDATE nodes
      SET status = $1
      WHERE id = $2
    `, [newStatus, nodeId]);
  }

  const handleDeleteNode = async (nodeId: string) => {
    const db = getDB();
    
    await db.query(`
      DELETE FROM nodes
      WHERE id = $1
    `, [nodeId]);
    
    setIsCreating(false);
    setSelectedTask(null);
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Toaster position="bottom-right" />
      <button
        onClick={() => setIsCreating(true)}
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10}}
      >
        +
      </button>
      <TaskForm
        isOpen={isModalOpen}
        onClose={() => {setIsCreating(false); setSelectedTask(null);}}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        existingTask={selectedTask}
      />
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onlyRenderVisibleElements={true}
        onNodeClick={(event, node) => {
          // Check if clicked on status toggle
          const target = event.target as HTMLElement;
          if (target.dataset.statusToggle === 'true') {
            handleToggleTaskStatus(node.id);
            return;
          }

          // Otherwise just select the node
          setSelectedNodeId(node.id);
        }}
        onNodeDoubleClick={(_, node) => {
          const row = result?.rows.find(r => r.id === node.id);
          if (row) handleEditNode(row);
        }}
        onPaneClick={() => setSelectedNodeId(null)} // Deselect node when clicking on the canvas
        minZoom={0.1}
        maxZoom={2}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;