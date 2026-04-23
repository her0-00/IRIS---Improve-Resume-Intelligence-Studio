import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(req: Request) {
  try {
    const { profile, query, location, api_key } = await req.json();

    const groqKey = api_key || process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });

    const groq = new Groq({ apiKey: groqKey });
    
    // Auto-fix obvious typos (simple rule)
    const cleanQuery = (query || "Job")
      .replace(/engeeneer/gi, 'engineer')
      .replace(/dara/gi, 'data')
      .replace(/data engeeneer/gi, 'data engineer')
      .replace(/systeme embarqu.e/gi, 'systèmes embarqués')
      .replace(/developpeur/gi, 'développeur');

    const searchTopic = `${cleanQuery} ${location || ""}`.trim();

    console.log(`[DEEPSEARCH-JOBS] Hunting for: ${searchTopic}...`);

    let jobListingsContext = "";
    let debugInfo: any = { linksFound: [], searchSuccess: false };

    try {
      // 1. Search for job listings - Simple query for DDG HTML stability
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchTopic + " jobs hiring now")}`;
      const searchResp = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
      });
      
      if (searchResp.ok) {
        const html = await searchResp.text();
        debugInfo.searchSuccess = true;

        // 2. Decode DDG redirection links
        const ddgLinks = html.match(/\/l\/\?uddg=([^"&'\s<>]+)/gi) || [];
        const topLinks = Array.from(new Set(ddgLinks.map(link => {
            try { return decodeURIComponent(link.replace('/l/?uddg=', '')); } catch (e) { return null; }
        })))
        .filter(l => l && (l.includes('indeed') || l.includes('welcometothejungle') || l.includes('hellowork') || l.includes('linkedin') || l.includes('job') || l.includes('career')))
        .slice(0, 3);

        debugInfo.linksFound = topLinks;

        // 3. Fetch and aggregate job details
        const results = await Promise.all(topLinks.map(async (url) => {
          try {
            if (!url) return null;
            const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (resp.ok) {
              const jobHtml = await resp.text();
              const text = jobHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').slice(0, 2000);
              return { url, content: text };
            }
          } catch (e) { return null; }
          return null;
        }));
        
        jobListingsContext = results.filter(r => r).map(r => `--- JOB AT ${r!.url} ---\n${r!.content}\n`).join("\n");
        
        // Final Fallback: if deep dive failed (blocking), use search snippets
        if (!jobListingsContext) {
           jobListingsContext = "FALLBACK SEARCH SNIPPETS:\n" + html.split('<a class="result__snippet"').slice(1, 4).join(' ').replace(/<[^>]*>/g, '').slice(0, 2000);
           console.log("[DEEPSEARCH-JOBS] Using search snippets as fallback.");
        }
      }
    } catch (e) {
      console.warn("[DEEPSEARCH-JOBS] Search failed:", e);
    }

    // 4. LLM Matching Analysis
    const matchingPrompt = `Senior Recruitment Agent Task:
Analyze the following JOB OFFERS against the CANDIDATE PROFILE.

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

JOB OFFERS CONTEXT:
${jobListingsContext || "No live listings found. Provide a general career advice based on the candidate's field."}

INSTRUCTION:
Return a JSON array of maximum 3 opportunities found.
Format:
{
  "matches": [
    {
      "job_title": "Title",
      "company": "Company",
      "url": "URL",
      "match_score": 0-100,
      "verdict": "APPLY | PASS | MAYBE",
      "pros": ["Reason 1", "Reason 2"],
      "cons": ["Risk 1"],
      "deep_insight": "A customized tip for this candidate."
    }
  ]
}
If no matches, return exactly: {"matches": []}. Output ONLY JSON. No talk.`;

    const modelStartTime = performance.now();
    const timeoutMs = 120000;
    const chatCompletion = await Promise.race([
      groq.chat.completions.create({
        messages: [{ role: 'user', content: matchingPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      )
    ]);

    const duration = ((performance.now() - modelStartTime) / 1000).toFixed(1);
    console.log(`[DEEPSEARCH-JOBS] Match completed in ${duration}s`);

    const content = chatCompletion.choices[0]?.message?.content || "";
    const data = extractJson(content);

    return NextResponse.json({ ...data, debug: debugInfo });

  } catch (error: any) {
    console.error('DeepSearch Jobs Error:', error);
    return NextResponse.json({ error: error.message || 'Search Agent Failed' }, { status: 500 });
  }
}
