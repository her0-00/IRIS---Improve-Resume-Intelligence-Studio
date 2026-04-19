import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { keywords, location, appId, appKey, contractType, company } = await req.json();
    
    // Use provided credentials or fallback to environment variables
    const finalAppId = appId || process.env.ADZUNA_APP_ID;
    const finalAppKey = appKey || process.env.ADZUNA_APP_KEY;

    if (!finalAppId || !finalAppKey) {
      return NextResponse.json({ 
        error: 'Adzuna credentials not configured. Please provide appId and appKey or configure environment variables.' 
      }, { status: 400 });
    }

    let finalKeywords = keywords || '';
    if (company && company.trim() !== '') {
        finalKeywords += ` ${company.trim()}`;
    }

    let url = `https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${finalAppId}&app_key=${finalAppKey}&what=${encodeURIComponent(finalKeywords)}&where=${encodeURIComponent(location || '')}&results_per_page=50`;
    if (contractType === 'permanent') url += '&permanent=1';
    if (contractType === 'contract') url += '&contract=1';
    if (contractType === 'part_time') url += '&part_time=1';

    const response = await fetch(url);
    
    if (!response.ok) {
        return NextResponse.json({ error: `Adzuna API Error: ${response.statusText}` }, { status: response.status });
    }

    const jobs = await response.json();
    return NextResponse.json(jobs.results);
  } catch (error: any) {
    console.error('[job-search] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
