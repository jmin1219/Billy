import { useCallback, useEffect, useState } from 'react';
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
import { getDB, initDB } from './db/init';
import TaskForm from './components/TaskForm';

const nodeTypes = {
  task: TaskNode
};

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isModalOpen = selectedTask !== null || isCreating;

  useEffect(() => {
    async function loadTasks() {
      // 1. Initialize database
      const db = await initDB();
      
      // 2. Query all tasks (what columns do you need?)
      const result = await db.query(`
        SELECT id, title, energy, interest, time_estimate, position_x, position_y 
        FROM nodes
      `);
      
      // 3. Transform rows to React Flow nodes
      const flowNodes = result.rows.map((row: any) => ({
        id: row.id,
        type: 'task',
        position: { 
          x: row.position_x ?? 100,  // Default to 100 if null
          y: row.position_y ?? 100 
        },
        data: {
          title: row.title,
          energy: row.energy,
          interest: row.interest,
          time_estimate: row.time_estimate,
          onEdit: () => handleEditNode(row)
        }
      }));
      
      setNodes(flowNodes);
    }
    
    loadTasks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !isModalOpen) {
        handleDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  // Function to reload tasks from DB
  const reloadTasks = async () => {
    const db = getDB();
    const result = await db.query(`
      SELECT id, title, energy, interest, time_estimate, position_x, position_y
      FROM nodes
    `);

    const flowNodes = result.rows.map((row: any) => ({
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
        onEdit: () => handleEditNode(row)
      }
    }));

    setNodes(flowNodes);
  }

  const handleEditNode = (nodeData: any) => {
    setSelectedTask({
      id: nodeData.id,
      title: nodeData.title,
      energy: nodeData.energy,
      interest: nodeData.interest,
      time_estimate: nodeData.time_estimate ?? 0
    });
  }

  const handleCreateTask = async (data: any) => {
    const db = getDB();
    
    await db.query(`
      INSERT INTO nodes (title, energy, interest, time_estimate)
      VALUES ($1, $2, $3, $4)
    `, [data.title, data.energy, data.interest, data.time_estimate]);

    await reloadTasks();
  }

  const handleUpdateTask = async (data: any) => {
    const db = getDB();
    
    await db.query(`
      UPDATE nodes
      SET title = $1, energy = $2, interest = $3, time_estimate = $4
      WHERE id = $5
    `, [data.title, data.energy, data.interest, data.time_estimate, selectedTask.id]);

    await reloadTasks();
  }

  const handleDeleteNode = async (nodeId: string) => {
    const db = getDB();
    
    await db.query(`
      DELETE FROM nodes
      WHERE id = $1
    `, [nodeId]);
    
    await reloadTasks();
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)} // Deselect node when clicking on the canvas
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;