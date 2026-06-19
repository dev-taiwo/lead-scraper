import { updateProspect, downloadProspectsCsv } from '../api';

export default function ProspectsTable({ prospects, onUpdate, filters, hideExport }) {
  async function toggleQualified(prospect) {
    const updated = await updateProspect(prospect.id, { qualified: !prospect.qualified });
    onUpdate(updated);
  }

  async function handleExport() {
    await downloadProspectsCsv(filters);
  }

  if (prospects.length === 0) {
    return (
      <div className="empty-state">
        <p>No leads yet. Run a scrape to populate this table.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      {!hideExport && (
        <div className="table-toolbar">
          <span className="table-count">{prospects.length} leads</span>
          <button className="btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      )}

      <table className="prospects-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Website</th>
            <th>Address</th>
            <th>Rating</th>
            <th>Niche</th>
            <th>City</th>
            <th>Qualified</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((p) => (
            <tr key={p.id}>
              <td className="cell-name">{p.name}</td>
              <td>{p.phone || '—'}</td>
              <td>
                {p.website ? (
                  <a href={p.website} target="_blank" rel="noopener noreferrer">
                    Visit
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="cell-address">{p.address || '—'}</td>
              <td>{p.rating != null ? p.rating.toFixed(1) : '—'}</td>
              <td>{p.niche}</td>
              <td>{p.city}</td>
              <td>
                <input
                  type="checkbox"
                  checked={!!p.qualified}
                  onChange={() => toggleQualified(p)}
                  aria-label={`Mark ${p.name} as qualified`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
