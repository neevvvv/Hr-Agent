const colors = {
  ANNUAL: 'from-emerald-500 to-emerald-600',
  SICK:   'from-rose-500 to-rose-600',
  CASUAL: 'from-amber-500 to-amber-600',
};
const icons = { ANNUAL: '🌴', SICK: '🤒', CASUAL: '☕' };

export default function BalanceCards({ balances }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {balances.map(b => (
        <div key={b.code} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${colors[b.code]} shadow`}>
          <div className="flex items-center justify-between">
            <span className="text-3xl">{icons[b.code]}</span>
            <span className="text-xs uppercase tracking-wider opacity-80">{b.code}</span>
          </div>
          <h3 className="mt-3 text-sm font-medium opacity-90">{b.name}</h3>
          <p className="text-4xl font-bold mt-1">{b.remaining}</p>
          <p className="text-xs opacity-80 mt-1">
            {b.used_days} used · {b.annual_quota} quota
          </p>
        </div>
      ))}
    </div>
  );
}