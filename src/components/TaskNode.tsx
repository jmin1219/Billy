import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface TaskNodeData {
    title: string;
    energy?: number;
    interest?: number;
    onEdit?: () => void;
}

interface TaskNodeProps {
    data: TaskNodeData;
}

function TaskNode({ data }: TaskNodeProps) {
    return (
        <div onDoubleClick={() => data.onEdit?.()}>
            <div style={{
                padding: '10px 20px',
                border: '2px solid #555',
                borderRadius: '8px',
                background: '#1a1a1a',
                color: 'white',
                minWidth: '150px'
            }}>
                <Handle type="target" position={Position.Top} />
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {data.title}
                </div>
                {data.energy && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                        Energy: {data.energy}/5
                    </div>
                )}
                <Handle type="source" position={Position.Bottom} />
            </div>
        </div>
    );
}

export default memo(TaskNode);
