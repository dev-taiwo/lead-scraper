import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getStages, getProspects, updateProspect } from '../api';
import Toast from '../components/Toast';

// ---------- Priority config ----------
const PRIORITY = {
  high:   { color: '#ef4444', label: 'High' },
  medium: { color: '#e8a13d', label: 'Medium' },
  low:    { color: '#94a3b8', label: 'Low' },
};

// ---------- Sortable Card ----------
function SortableCard({ prospect, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: prospect.id, data: { prospect } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="pipeline-card"
      onClick={onClick}
    >
      <CardContent prospect={prospect} />
    </div>
  );
}

function CardContent({ prospect }) {
  const p = PRIORITY[prospect.priority || 'medium'];
  return (
    <>
      <div className="pc-top">
        <span className="pc-name">{prospect.name}</span>
        <span className="pc-dot" style={{ background: p.color }} title={p.label} />
      </div>
      {prospect.phone && <div className="pc-meta">{prospect.phone}</div>}
      {prospect.city  && <div className="pc-meta">{prospect.city}</div>}
      {prospect.next_step && <div className="pc-step">→ {prospect.next_step}</div>}
    </>
  );
}

// ---------- Stage Column ----------
function StageColumn({ stage, prospects, onCardClick }) {
  const ids = prospects.map((p) => p.id);
  return (
    <div className="pipeline-col">
      <div className="pipeline-col-header" style={{ borderTopColor: stage.color }}>
        <span className="pipeline-col-dot" style={{ background: stage.color }} />
        <span className="pipeline-col-name">{stage.name}</span>
        <span className="pipeline-col-count">{prospects.length}</span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="pipeline-col-body">
          {prospects.length === 0 && (
            <div className="pipeline-drop-hint">Drop leads here</div>
          )}
          {prospects.map((p) => (
            <SortableCard key={p.id} prospect={p} onClick={() => onCardClick(p)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ---------- Detail Modal ----------
function DetailModal({ prospect, stages, onSave, onClose, toast }) {
  const [form, setForm] = useState({
    stage_id:          prospect.stage_id || stages[0]?.id || '',
    priority:          prospect.priority || 'medium',
    notes:             prospect.notes || '',
    next_step:         prospect.next_step || '',
    last_contacted_at: prospect.last_contacted_at?.slice(0, 10) || '',
    next_follow_up:    prospect.next_follow_up?.slice(0, 10) || '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        last_contacted_at: form.last_contacted_at
          ? new Date(form.last_contacted_at).toISOString() : null,
        next_follow_up: form.next_follow_up
          ? new Date(form.next_follow_up).toISOString() : null,
      };
      const updated = await updateProspect(prospect.id, payload);
      onSave(updated);
      toast('Saved');
      onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{prospect.name}</h2>
            <p className="modal-sub">{prospect.niche} · {prospect.city}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Read-only info block */}
        <div className="modal-meta">
          {prospect.phone   && <a href={`tel:${prospect.phone}`} className="meta-chip">📞 {prospect.phone}</a>}
          {prospect.email   && <a href={`mailto:${prospect.email}`} className="meta-chip">✉ {prospect.email}</a>}
          {prospect.website && <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="meta-chip">🌐 Website</a>}
          {prospect.address && <span className="meta-chip">📍 {prospect.address}</span>}
          {prospect.rating  && <span className="meta-chip">⭐ {prospect.rating.toFixed(1)}{prospect.reviewsCount ? ` (${prospect.reviewsCount})` : ''}</span>}
        </div>

        {/* Editable fields */}
        <div className="modal-fields">
          <div className="mfield">
            <label>Stage</label>
            <select value={form.stage_id} onChange={(e) => set('stage_id', e.target.value)}>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="mfield">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mfield">
            <label>Last Contacted</label>
            <input type="date" value={form.last_contacted_at}
              onChange={(e) => set('last_contacted_at', e.target.value)} />
          </div>

          <div className="mfield">
            <label>Next Follow-up</label>
            <input type="date" value={form.next_follow_up}
              onChange={(e) => set('next_follow_up', e.target.value)} />
          </div>

          <div className="mfield mfield-full">
            <label>Next Step</label>
            <input type="text" value={form.next_step} placeholder="e.g. Send proposal"
              onChange={(e) => set('next_step', e.target.value)} />
          </div>

          <div className="mfield mfield-full">
            <label>Notes</label>
            <textarea rows={6} value={form.notes} placeholder="Add notes about this lead..."
              onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Pipeline Page ----------
export default function Pipeline() {
  const [stages, setStages]       = useState([]);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [active, setActive]       = useState(null);   // card being dragged
  const [selected, setSelected]   = useState(null);   // card detail modal
  const [toastMsg, setToastMsg]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([getStages(), getProspects()]);
        setStages(s);
        setProspects(p);
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, []);

  // Map stage_id → stage; fallback missing/null stage_id → first stage
  function getStageIdForProspect(p) {
    if (!p.stage_id || p.stage_id === 'new') return stages[0]?.id;
    return p.stage_id;
  }

  function getProspectsForStage(stageId) {
    return prospects.filter((p) => getStageIdForProspect(p) === stageId);
  }

  function findStageByProspectId(prospectId) {
    const p = prospects.find((x) => x.id === prospectId);
    return p ? getStageIdForProspect(p) : null;
  }

  function handleDragStart({ active: a }) {
    setActive(prospects.find((p) => p.id === a.id) || null);
  }

  async function handleDragEnd({ active: a, over }) {
    setActive(null);
    if (!over) return;

    // over.id could be a stageId (column droppable) or a prospectId (card in SortableContext)
    const overId = over.id;
    const targetStage = stages.find((s) => s.id === overId)
      || stages.find((s) => s.id === findStageByProspectId(overId));

    if (!targetStage) return;

    const dragged = prospects.find((p) => p.id === a.id);
    if (!dragged || getStageIdForProspect(dragged) === targetStage.id) return;

    // Optimistically update UI
    setProspects((prev) =>
      prev.map((p) => p.id === dragged.id ? { ...p, stage_id: targetStage.id } : p)
    );

    try {
      await updateProspect(dragged.id, { stage_id: targetStage.id });
      showToast(`Moved ${dragged.name} to ${targetStage.name}`);
    } catch (e) {
      // Revert on failure
      setProspects((prev) =>
        prev.map((p) => p.id === dragged.id ? { ...p, stage_id: dragged.stage_id } : p)
      );
      alert(e.message);
    }
  }

  function handleProspectSave(updated) {
    setProspects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setSelected(updated); // keep modal open with updated data until closed
  }

  if (loading) return <div className="pipeline-loading">Loading pipeline…</div>;
  if (error)   return <div className="pipeline-error">Error: {error}</div>;

  return (
    <div className="pipeline-shell">
      <div className="pipeline-page-header">
        <h1>Pipeline</h1>
        <p className="app-subtitle">Drag leads between stages as you work them</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="pipeline-board">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              prospects={getProspectsForStage(stage.id)}
              onCardClick={(p) => setSelected(p)}
            />
          ))}
        </div>

        {/* Ghost card while dragging */}
        <DragOverlay>
          {active && (
            <div className="pipeline-card pipeline-card-overlay">
              <CardContent prospect={active} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selected && (
        <DetailModal
          prospect={selected}
          stages={stages}
          onSave={handleProspectSave}
          onClose={() => setSelected(null)}
          toast={showToast}
        />
      )}

      {toastMsg && <Toast message={toastMsg} />}
    </div>
  );
}
