import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

function extractJson(text: string): any {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in model response');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }
  throw new Error('Incomplete JSON object');
}

export async function POST(req: Request) {
  try {
    const { company_name, api_key } = await req.json();

    const cleanName = (typeof company_name === 'string' ? company_name : '').trim().slice(0, 50);
    const cleanKey = (typeof api_key === 'string' ? api_key : '').trim();

    if (!cleanName) {
      return NextResponse.json({ error: 'Missing company name' }, { status: 400 });
    }

    const groqKey = cleanKey || process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 400 });
    }

    // Diagnostic log for Render debugging
    console.log(`[BRAND-COLORS] Input: "${cleanName}" | Key length: ${groqKey.length}`);

    const groq = new Groq({ apiKey: groqKey });

    // --- NEW: Web Search & Deep Extraction ---
    console.log(`[BRAND-COLORS] Searching ground truth for: ${cleanName}...`);
    let groundTruth = "";
    try {
      // 1. Try Direct Targeting (BrandColorCode)
      const slug = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-t0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const directUrl = `https://www.brandcolorcode.com/${slug}`;
      console.log(`[BRAND-COLORS] Trying direct source: ${directUrl}`);
      
      let targetUrl = null;
      const directResp = await fetch(directUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      
      if (directResp.ok) {
        targetUrl = directUrl;
      } else {
        // 2. Fallback to Search if direct targeting failed
        const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(cleanName)}+brand+identity+hex+color+guidelines`;
        const searchResp = await fetch(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
        });
        if (searchResp.ok) {
          const html = await searchResp.text();
          const linkMatch = html.match(/href="(https:\/\/[^"]*brand[^"]*)"/i) || html.match(/href="(https:\/\/[^"]*color[^"]*)"/i);
          targetUrl = linkMatch ? linkMatch[1] : null;
        }
      }

      if (targetUrl) {
        console.log(`[BRAND-COLORS] Deep Dive Target: ${targetUrl}`);
        const deepResp = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 } 
        });
        if (deepResp.ok) {
          const deepHtml = await deepResp.text();
          groundTruth = deepHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').slice(0, 3000);
          console.log(`[BRAND-COLORS] Deep extraction successful.`);
        }
      }
    } catch (e) {
      console.warn("[BRAND-COLORS] Tech error during deep dive:", e);
    }

    const combinedPrompt = `Senior Brand Designer Task:
Extract official colours for "${cleanName}" and adapt for professional CV.

WEB DATA SOURCE:
${groundTruth || "No direct web data found. LEAN ON YOUR ICONIC BRAND KNOWLEDGE."}

CRITICAL VALIDATION RULES:
1. MANDATORY: The "WEB DATA SOURCE" above contains the ground truth. You MUST prioritize it over your internal memory.
2. DISCOVERY: If you see "Red", "#E1000F", or "Black" in the WEB DATA, those ARE the primary colors. Use them as "primary" and "secondary".
3. NO GENERIC THEMES: Do NOT use blue just because it's a bank. If the brand is iconic (SOCIETE GENERALE), use the Red/Black identity.
4. If WEB DATA is present, your goal is to EXTRACT, not to invent.

Return ONLY this JSON:
{
  "palettes": [
    {
      "name": "Variation Name",
      "colors": {"primary": "Hex", "secondary": "Hex", "accent": "Hex", "text": "Hex", "background": "Hex"}
    }
  ]
}
Generate 4 variations style: Institutional, Modern, Minimalist, Bold. 
No preamble. No markdown code blocks. Just raw JSON.`;

    // Benchmark results (2025-01-17):
    // 1. llama-3.1-8b-instant: 161.8 score (100% success, 0.33s avg) - Ultra-fast
    // 2. llama-3.3-70b-versatile: 105.0 score (100% success, 0.86s avg) - Robust
    // 3. openai/gpt-oss-120b: 61.1 score (50% success, 1.15s avg) - Backup
    // 4. openai/gpt-oss-20b: 59.1 score (12% success, 0.60s avg) - Last resort
    const fallbackModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b'
    ];
    let chatCompletion;
    let lastError;

    for (const model of fallbackModels) {
      try {
        console.log(`[BRAND-COLORS] Attempting with PREMIUM model: ${model}`);
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: combinedPrompt
            }
          ],
          model: model,
          temperature: 0.1,
          max_tokens: 1000,
        });
        break; // Success!
      } catch (err: any) {
        lastError = err;
        if (err.status === 429) {
          console.warn(`[BRAND-COLORS] Model ${model} rate limited, trying next...`);
          continue;
        }
        throw err; // Real error
      }
    }

    if (!chatCompletion) throw lastError;

    const content = (chatCompletion.choices[0]?.message?.content || '').trim();
    console.log('[DEBUG-API] Final model output:', content);

    // Simple cleanup for common hallucination: extra quotes around objects in arrays
    const cleanedContent = content
      .replace(/",\s*\{/g, ', {')
      .replace(/\}\s*,"/g, '}, ')
      .replace(/\[\s*"/g, '[')
      .replace(/"\s*\]/g, ']');

    try {
      const data = extractJson(cleanedContent);
      return NextResponse.json(data);
    } catch (e: any) {
      console.error('[CompanyColors] JSON Parse Error:', content);
      return NextResponse.json({ error: 'Failed to generate valid palettes', raw: content }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Company Colors Error:', error);
    return NextResponse.json({ error: error.message || 'API Failed' }, { status: 500 });
  }
}
