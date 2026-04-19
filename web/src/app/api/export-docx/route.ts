import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let tmpIn: string | null = null;
  let tmpOut: string | null = null;
  try {
    const { cv_data } = await req.json();

    if (!cv_data) {
      return NextResponse.json({ error: 'Missing cv_data' }, { status: 400 });
    }

    const requestId = crypto.randomUUID();
    tmpIn = path.join(os.tmpdir(), `docx_in_${requestId}.json`);
    tmpOut = path.join(os.tmpdir(), `docx_out_${requestId}.json`);

    const payload = { cv_data, output_format: 'docx' };
    fs.writeFileSync(tmpIn, JSON.stringify(payload), 'utf8');
    console.log(`[export-docx] [${requestId}] payload keys:`, Object.keys(payload), 'output_format:', payload.output_format);

    const pythonScript = path.resolve(process.cwd(), '..', 'backend', 'worker.py');
    const tmpInNorm = tmpIn.replace(/\\/g, '/');
    const tmpOutNorm = tmpOut.replace(/\\/g, '/');

    return new Promise<NextResponse>((resolve) => {
      const pyProcess = spawn('python', [pythonScript, tmpInNorm, tmpOutNorm]);

      let errorData = '';
      pyProcess.stderr.on('data', (chunk) => { errorData += chunk.toString(); });
      pyProcess.stdout.on('data', (chunk) => { console.log(`[export-docx] [${requestId}] stdout:`, chunk.toString()); });

      pyProcess.on('error', (err) => {
        console.error(`[export-docx] [${requestId}] spawn error:`, err);
        resolve(NextResponse.json({ error: 'Failed to start Python process', details: err.message }, { status: 500 }));
      });

      pyProcess.on('close', (code) => {
        try {
          if (code !== 0) {
            let traceback = '';
            try {
              if (fs.existsSync(tmpOut!)) {
                const r = JSON.parse(fs.readFileSync(tmpOut!, 'utf8'));
                traceback = r.traceback || r.error || '';
              }
            } catch {}
            console.error(`[export-docx] [${requestId}] Python exited with code`, code, '| stderr:', errorData, '| traceback:', traceback);
            return resolve(NextResponse.json({ error: 'DOCX generation failed', details: errorData || traceback }, { status: 500 }));
          }

          if (!fs.existsSync(tmpOut!)) {
            console.error(`[export-docx] [${requestId}] Output file missing`);
            return resolve(NextResponse.json({ error: 'Output file missing' }, { status: 500 }));
          }

          const raw = fs.readFileSync(tmpOut!, 'utf8');
          const parsed = JSON.parse(raw);
          console.log(`[export-docx] [${requestId}] Parsed output keys:`, Object.keys(parsed));
          if (!parsed.success) {
            console.error(`[export-docx] [${requestId}] Error:`, parsed.error, '\n', parsed.traceback);
            return resolve(NextResponse.json({ error: parsed.error || 'DOCX generation failed', traceback: parsed.traceback }, { status: 500 }));
          }

          const docxBase64 = parsed.docx_base64 || parsed.pdf_base64;
          if (!docxBase64) {
            console.error(`[export-docx] [${requestId}] No base64 data found. Keys:`, Object.keys(parsed));
            return resolve(NextResponse.json({ error: 'No DOCX data in response' }, { status: 500 }));
          }

          const docxBuffer = Buffer.from(docxBase64, 'base64');
          const filename = `CV_${cv_data.name?.replace(/\s+/g, '_') || 'Resume'}.docx`;
          return resolve(new NextResponse(docxBuffer, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          }));
        } catch (e: any) {
          console.error(`[export-docx] [${requestId}] parse error:`, e.message, '| stderr:', errorData);
          return resolve(NextResponse.json({ error: 'Failed to parse output' }, { status: 500 }));
        } finally {
          try { if (tmpIn && fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
          try { if (tmpOut && fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch {}
        }
      });
    });
  } catch (error: any) {
    try { if (tmpIn && fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn); } catch {}
    try { if (tmpOut && fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch {}
    console.error('[export-docx] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
