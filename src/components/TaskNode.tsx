import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface TaskNodeData {
    title: string;
    energy?: number;
    interest?: number;
    time_estimate?: number;
    status?: string;
}

interface TaskNodeProps {
    data: TaskNodeData;
}

function getEnergyColor(energy?: number): string {
    if (!energy) return '#1a1a1a';
    if (energy <= 2) return '#166534';
    if (energy === 3) return '#dce000';
    return '#c21212';
}

function getEnergyEmoji(energy?: number): string {
    if (!energy) return '';
    if (energy <= 2) return '⚡️';
    if (energy === 3) return '☑️';
    return '🧑🏻‍💻';
}

function TaskNode({ data }: TaskNodeProps) {
    const bgColor = getEnergyColor(data.energy);

    return (
        <div>
            <div style={{
                padding: '12px 16px',
                border: '2px solid #555',
                borderRadius: '8px',
                background: bgColor,
                color: 'white',
                minWidth: '180px',
                maxWidth: '250px',
                minHeight: '100px',
                maxHeight: '200px'
            }}>
                <Handle type="target" position={Position.Top} />

                {/* Title + Energy Emoji */}
                <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>{data.title}</span>
                    <span style={{ fontSize: '20px'}}>{getEnergyEmoji(data.energy)}</span>
                </div>

                {/* Properties Row */}
                <div style={{ fontSize: '12px', display: 'flex', color: '#d1d5db', gap: '12px' }}>
                    {data.energy && <span>E: {data.energy}/5</span>}
                    {data.interest && <span>I: {data.interest}/5</span>}
                    {data.time_estimate != null && <span>T: {data.time_estimate} min</span>}

                    {/* Status indicator - Click to toggle status: Complete or Incomplete*/}
                    <span style={{ 
                        marginLeft: 'auto',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                    data-status-toggle="true"
                    >
                        {data.status === 'done' ? '✅' : '⭕️'}
                    </span>
                </div>
                <Handle type="source" position={Position.Bottom} />
            </div>
        </div>
    );
}

export default memo(TaskNode);
