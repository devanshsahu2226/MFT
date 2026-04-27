const API_URL = process.env.NEXT_PUBLIC_GS_API_URL;

export async function gsApiCall(action: string, params: Record<string, any>) {
  if (!API_URL) {
    return { success: false, error: 'API URL not configured' };
  }

  const baseUrl = API_URL.split('?')[0];
  const url = new URL(baseUrl);
  url.searchParams.append('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      url.searchParams.append(key, JSON.stringify(value));
    } else {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('gsApiCall Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ✅ Fetch Nifty from Google Sheet
export async function fetchMarketData(symbol: string = 'NIFTY50') {
  return await gsApiCall('fetch-market-data', { symbol });
}