export default function NPSPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">National Pension System (NPS)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="Current Corpus" value="₹4,52,300" />
        <InfoCard label="Monthly Contribution" value="₹5,000" />
        <InfoCard label="Expected Returns (CAGR)" value="10.2%" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Tier Allocation</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-3 rounded-tl-lg">Scheme</th>
                <th className="p-3">Allocation (%)</th>
                <th className="p-3">Current Value</th>
                <th className="p-3 rounded-tr-lg">Returns</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">Equity (Scheme E)</td><td className="p-3">75%</td><td className="p-3">₹3,39,225</td><td className="p-3 text-green-600">+12.4%</td>
              </tr>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">Corporate Bonds (Scheme C)</td><td className="p-3">15%</td><td className="p-3">₹67,845</td><td className="p-3 text-green-600">+7.8%</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">Govt Securities (Scheme G)</td><td className="p-3">10%</td><td className="p-3">₹45,230</td><td className="p-3 text-green-600">+6.9%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}