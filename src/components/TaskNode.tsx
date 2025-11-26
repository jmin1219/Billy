import { Handle, Position, useStore } from "@xyflow/react";
import { memo } from "react";
import "./TaskNode.css";

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

const zoomSelector =  (s) => s.transform[2];

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
    const zoom = useStore(zoomSelector);
    const bgColor = getEnergyColor(data.energy);

    return (
        <div className="task-node">
            {/* LOD 1: Dot View (far zoom out) */}
            {zoom < 0.4 && (
            <>
                <Handle type="target" position={Position.Top} />
                <div
                    style={{
                        backgroundColor: bgColor,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)'   
                    }}
                />
                <Handle type="source" position={Position.Bottom} />
            </>
            )}
            
            {/* LOD 2: Summary View (medium zoom) */}
            {zoom >= 0.4 && zoom < 0.8 && (
            <div className="task-summary" style= {{
                backgroundColor: '#2a2a2a',
                borderLeft: `4px solid ${bgColor}`,
                padding: '8px 12px',
                minWidth: '120px'
            }}>
                <Handle type="target" position={Position.Top} />
                <div className="task-title" style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#fff'
                }}>{data.title}</div>
                <div 
                className="status-indicator"
                style={{ backgroundColor: getEnergyColor(data.energy) }}
                />
                <Handle type="source" position={Position.Bottom} />
            </div>
            )}
            
            {/* LOD 3: Full Detail (zoomed in) */}
            {zoom >= 0.8 && (
            <div className="task-node-content" style={{backgroundColor: bgColor }}>
                <Handle type="target" position={Position.Top} />
                
                <div className="task-header">
                    <span 
                        className="completion-toggle"
                        data-toggle="completion"
                        role="button"
                    >
                        {data.status === 'done' ? '✅' : '⭕️'}
                    </span>
                    <h3 className="task-title">{data.title}</h3>
                </div>
                
                <div className="task-properties">
                <span className="energy-indicator">
                    {getEnergyEmoji(data.energy)} E: {data.energy}
                </span>
                <span>I: {data.interest}</span>
                <span>T: {data.time_estimate}h</span>
                </div>
                
                <Handle type="source" position={Position.Bottom} />
            </div>
            )}
        </div>
    );
}

export default memo(TaskNode);
