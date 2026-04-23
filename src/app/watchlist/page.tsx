export default function WatchlistPage() {
  const stocks = [
    { symbol: 'RELIANCE', price: 2845.50, change: 1.25, target: 3000, qty: 10 },
    { symbol: 'TCS', price: 3850.20, change: -0.8, target: 4000, qty: 5 },
    { symbol: 'INFY', price: 1620.40, change: 0.5, target: 1800, qty: 15 },
    { symbol: 'HDFCBANK', price: 1450.10, change: 2.1, target: 1600, qty: 20 },
    { symbol: 'BTC/USD', price: 84500.00, change: -1.5, target: 90000, qty: 0.05 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Watchlist</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold">Symbol</th>
                <th className="p-4 font-semibold">Current Price</th>
                <th className="p-4 font-semibold">24h Change</th>
                <th className="p-4 font-semibold">Target</th>
                <th className="p-4 font-semibold">Qty Watched</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.symbol} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 font-medium">{s.symbol}</td>
                  <td className="p-4">₹{s.price.toLocaleString()}</td>
                  <td className={`p-4 font-medium ${s.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {s.change > 0 ? '+' : ''}{s.change}%
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400">₹{s.target.toLocaleString()}</td>
                  <td className="p-4">{s.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}