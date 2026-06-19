import { useState } from 'react';
import { updateProspect } from '../api';
import ProspectCard from './ProspectCard';

export default function KanbanBoard({ stages, prospects, onProspectUpdate }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function getProspectsForStage(stageId) {
    return prospects.filter((p) => (p.stage_id || 'stage-1') === stageId);
  }

  async function handleDrop(stageId) {
    if (!dragging || dragging.stage_id === stageId) {
      setDragging(null); setDragOver(null); return;
    }
    try {
      const updated = await updateProspect(dragging.id, { stage_id: stageId });
      onProspectUpdate(updated);
    } catch (e) { console.error(e); }
    setDragging(null); setDragOver(null);
  }

  if (stages.length === 0) {
    return <div className="empty-state"><p>No stages yet.</p></div>;
  }

  return (
    <div className="kanban-board">
      {stages.map((stage) => {
        const cards = getProspectsForStage(stage.id);
        return (
          <div
            key={stage.id}
            className={`kanban-col ${dragOver === stage.id ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(stage.id)}
          >
            <div className="kanban-col-header" style={{ borderTopColor: stage.color }}>
              <span className="kanban-col-dot" style={{ background: stage.color }} />
              <span className="kanban-col-name">{stage.name}</span>
              <span className="kanban-col-count">{cards.length}</span>
            </div>
            <div className="kanban-col-body">
              {cards.length === 0 && (
                <div className="kanban-empty">Drop leads here</div>
              )}
              {cards.map((p) => (
                <ProspectCard
                  key={p.id}
                  prospect={p}
                  stages={stages}
                  onUpdate={onProspectUpdate}
                  onDragStart={() => setDragging(p)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
