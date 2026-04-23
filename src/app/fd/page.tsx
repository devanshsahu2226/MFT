export default function FDPage() {
  const fds = [
    { bank: 'SBI', amount: 500000, rate: 6.8, tenure: '3 Years', maturity: '₹6,12,500', status: 'Active' },
    { bank: 'HDFC', amount: 200000, rate: 7.1, tenure: '5 Years', maturity: '₹2,80,450', status: 'Active' },
    { bank: 'ICICI', amount: 100000, rate: 7.2, tenure: '1 Year', maturity: '₹1,07,400', status: 'Matured' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fixed Deposits (FD)</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Your Deposits</h2>
        <div className="space-y-4">
          {fds.map((fd, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-semibold text-lg">{fd.bank} FD</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fd.tenure} @ {fd.rate}%</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div><p className="text-gray-500 dark:text-gray-400">Invested</p><p className="font-medium">₹{fd.amount.toLocaleString()}</p></div>
                <div><p className="text-gray-500 dark:text-gray-400">Maturity</p><p className="font-medium text-green-600 dark:text-green-400">{fd.maturity}</p></div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${fd.status === 'Active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {fd.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}