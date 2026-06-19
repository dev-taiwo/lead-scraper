import { useState } from 'react';
import { updateProspect } from '../api';

export default function ProspectDetail({ prospect, stages, onUpdate, onClose }) {
  const [form, setForm] = useState({
    stage_id:         prospect.stage_id || 'stage-1',
    priority:         prospect.priority || 'medium',
    notes:            prospect.notes || '',
    next_step:        prospect.next_step || '',
    last_contacted_at: prospect.last_contacted_at ? prospect.last_contacted_at.slice(0, 10) : '',
    next_follow_up:   prospect.next_follow_up ? prospect.next_follow_up.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        last_contacted_at: form.last_contacted_at ? new Date(form.last_contacted_at).toISOString() : null,
        next_follow_up:    form.next_follow_up    ? new Date(form.next_follow_up).toISOString()    : null,
      };
      const updated = await updateProspect(prospect.id, payload);
      onUpdate(updated);
      onClose();
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{prospect.name}</h2>
            <p className="modal-sub">{prospect.address || prospect.city}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-meta">
          {prospect.phone   && <a href={`tel:${prospect.phone}`}   className="meta-chip">📞 {prospect.phone}</a>}
          {prospect.website && <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="meta-chip">🌐 Website</a>}
          {prospect.rating  && <span className="meta-chip">⭐ {prospect.rating.toFixed(1)} ({prospect.reviewsCount || 0} reviews)</span>}
        </div>

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
            <textarea rows={4} value={form.notes} placeholder="Add notes..."
              onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
