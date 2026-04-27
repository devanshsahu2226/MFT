const API_URL = process.env.NEXT_PUBLIC_GS_API_URL;

if (!API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_GS_API_URL is not set in .env.local');
}

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
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('gsApiCall Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// ✅ Fetch Market Data (Nifty 50)
export async function fetchMarketData(symbol: string = 'NIFTY50') {
  return await gsApiCall('fetch-market-data', { symbol });
}

// ✅ Fetch NPS NAV from npsnav.in via Apps Script proxy
export async function fetchNPSNav(code: string) {
  return await gsApiCall('fetch-nps-nav', { code });
}
// ✅ Fetch NPS NAV from npsnav.in
export async function getNPSNav(code: string) {
  return await gsApiCall('get-nps-nav', { code });
}