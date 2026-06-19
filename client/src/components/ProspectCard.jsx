import { useState } from 'react';
import { updateProspect } from '../api';
import ProspectDetail from './ProspectDetail';

const PRIORITY_COLORS = { low: '#94a3b8', medium: '#e8a13d', high: '#ef4444' };

export default function ProspectCard({ prospect, stages, onUpdate, onDragStart }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="prospect-card"
        draggable
        onDragStart={onDragStart}
        onClick={() => setOpen(true)}
      >
        <div className="card-top">
          <span className="card-name">{prospect.name}</span>
          <span
            className="card-priority"
            style={{ background: PRIORITY_COLORS[prospect.priority || 'medium'] + '33',
                     color: PRIORITY_COLORS[prospect.priority || 'medium'] }}
          >
            {prospect.priority || 'medium'}
          </span>
        </div>
        {prospect.phone && <div className="card-detail">{prospect.phone}</div>}
        {prospect.rating && (
          <div className="card-detail">⭐ {prospect.rating.toFixed(1)}</div>
        )}
        {prospect.next_step && (
          <div className="card-next-step">→ {prospect.next_step}</div>
        )}
        {prospect.next_follow_up && (
          <div className="card-followup">
            📅 {new Date(prospect.next_follow_up).toLocaleDateString()}
          </div>
        )}
      </div>
      {open && (
        <ProspectDetail
          prospect={prospect}
          stages={stages}
          onUpdate={(updated) => { onUpdate(updated); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
