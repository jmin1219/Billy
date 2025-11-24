import { useState } from "react";
import './TaskForm.css'

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
    existingTask?: TaskFormData & { id: string }; // Optional for opening task form with 
}

export interface TaskFormData {
    title: string;
    energy: number;
    interest: number;
    time_estimate: number;
}
    
export default function TaskForm({ isOpen, onClose, onSubmit, existingTask }: TaskFormProps) {
    if (!isOpen) return null;

    const [title, setTitle] = useState(existingTask?.title ?? '');
    const [energy, setEnergy] = useState(existingTask?.energy ?? 2);
    const [interest, setInterest] = useState(existingTask?.interest ?? 2);
    const [timeEstimate, setTimeEstimate] = useState(existingTask?.time_estimate ?? 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            title,
            energy,
            interest,
            time_estimate: timeEstimate,
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{existingTask ? 'Edit Task' : 'Create Task'}</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <div className="energy-selector">
                        <label>Energy:</label>
                        <div className="button-group">
                            {[1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setEnergy(val)}
                                    className={energy === val ? 'selected' : ''}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="interest-selector">
                        <label>Interest:</label>
                        <div className="button-group">
                            {[1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setInterest(val)}
                                    className={interest === val ? 'selected' : ''}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                    <input type="number" value={timeEstimate} onChange={(e) => setTimeEstimate(Number(e.target.value))} />
 
                    <div className="button-group">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">{existingTask ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}