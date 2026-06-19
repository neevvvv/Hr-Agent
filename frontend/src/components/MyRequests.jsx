const statusStyles = {
  pending:   'bg-amber-100 text-amber-800',
  approved:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-700',
};

export default function MyRequests({ requests }) {
  if (!requests.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-slate-500 text-sm">
        No leave requests yet. Submit one above ☝️
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4">My Requests</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left text-xs uppercase">
            <tr>
              <th className="py-2">Type</th>
              <th className="py-2">Dates</th>
              <th className="py-2">Days</th>
              <th className="py-2">Reason</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2 font-medium">{r.leave_type}</td>
                <td className="py-2 text-slate-600">{r.start_date} → {r.end_date}</td>
                <td className="py-2">{r.days}</td>
                <td className="py-2 text-slate-600 max-w-xs truncate">{r.reason || '—'}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusStyles[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}