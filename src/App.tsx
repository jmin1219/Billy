import { useCallback, useState } from 'react';
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

const nodeTypes = {
  task: TaskNode
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'task',
    position: { x: 100, y: 100 },
    data: { title: 'Buy milk', energy: 2, interest: 3 }
  },
  {
    id: '2',
    type: 'task',
    position: { x: 300, y: 100 },
    data: { title: 'Fix car', energy: 5, interest: 2 }
  },
  {
    id: '3',
    type: 'task',
    position: { x: 200, y: 250 },
    data: { title: 'Call mom', energy: 1, interest: 5 }
  }
];

function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onlyRenderVisibleElements={true}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;