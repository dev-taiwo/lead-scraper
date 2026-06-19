const STATUS_LABELS = {
  RUNNING: 'Running',
  READY: 'Starting',
  SUCCEEDED: 'Done',
  FAILED: 'Failed',
  ABORTED: 'Aborted',
  'TIMED-OUT': 'Timed out',
};

export default function ScrapeStatus({ run }) {
  if (!run) return null;

  const label = STATUS_LABELS[run.status] || run.status;
  const statusClass =
    run.status === 'SUCCEEDED'
      ? 'status-success'
      : run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT'
      ? 'status-danger'
      : 'status-running';

  return (
    <div className={`scrape-status ${statusClass}`}>
      <span className="status-dot" />
      <span className="status-text">
        <strong>{label}</strong> — {run.niche} in {run.city}
      </span>
      {run.status === 'SUCCEEDED' && (
        <span className="status-counts">
          {run.insertedCount} new · {run.skippedCount} skipped
        </span>
      )}
    </div>
  );
}
