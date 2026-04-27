"use client";

import { useState } from 'react';
import { gsApiCall } from '@/lib/googleSheetsApi';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    // Test with a simple action (you can add a test action in Apps Script)
    const res = await gsApiCall('test', { message: 'Hello from Next.js!' });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Google Sheets API Test</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>

        {result && (
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}