import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { pdf_base64 } = await req.json();

    if (!pdf_base64) {
      return NextResponse.json({ error: 'Missing pdf_base64' }, { status: 400 });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdf_base64, 'base64');

    return new Promise<NextResponse>((resolve) => {
      const pythonScript = path.resolve(process.cwd(), '..', 'backend', 'extractor.py');
      const pyProcess = spawn('python', [pythonScript]);
      
      let outputData = '';
      let errorData = '';
      
      pyProcess.stdout.on('data', (chunk) => {
        outputData += chunk.toString();
      });
      
      pyProcess.stderr.on('data', (chunk) => {
        errorData += chunk.toString();
      });
      
      pyProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[ats-simulator] Python exit code:', code);
          console.error('[ats-simulator] Python stderr:', errorData);
          return resolve(NextResponse.json({ error: 'Python Extractor Failed', details: errorData }, { status: 500 }));
        }
        
        try {
          const parsed = JSON.parse(outputData);
          if (!parsed.success) {
            return resolve(NextResponse.json({ error: parsed.error || 'Extractor Error' }, { status: 500 }));
          }
          
          // Simulate ATS parsing
          const extractedText = parsed.text;
          const lines = extractedText.split('\n').filter((l: string) => l.trim());
          
          // ATS Metrics
          const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
          const charCount = extractedText.length;
          const lineCount = lines.length;
          
          // Check for common ATS issues
          const issues: string[] = [];
          
          // Check if text is extractable
          if (wordCount < 50) {
            issues.push('⚠️ Très peu de texte extrait - Le PDF pourrait contenir des images non-OCR');
          }
          
          // Check for special characters that might break ATS
          const specialChars = extractedText.match(/[^\x00-\x7F]/g);
          if (specialChars && specialChars.length > 50) {
            issues.push('⚠️ Nombreux caractères spéciaux détectés - Certains ATS pourraient avoir des difficultés');
          }
          
          // Check for proper structure
          const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedText);
          const hasPhone = /[\d\s\-\+\(\)]{10,}/.test(extractedText);
          
          if (!hasEmail) issues.push('❌ Email non détecté - Critique pour ATS');
          if (!hasPhone) issues.push('⚠️ Téléphone non détecté clairement');
          
          // Check for common sections
          const sections = {
            experience: /experience|expérience/i.test(extractedText),
            education: /education|formation|études/i.test(extractedText),
            skills: /skills|compétences|expertise/i.test(extractedText),
            summary: /summary|résumé|profil/i.test(extractedText)
          };
          
          const missingSections = Object.entries(sections)
            .filter(([_, found]) => !found)
            .map(([section]) => section);
          
          if (missingSections.length > 0) {
            issues.push(`⚠️ Sections potentiellement manquantes: ${missingSections.join(', ')}`);
          }

          // ATS Score (0-100)
          let atsScore = 100;
          if (wordCount < 50) atsScore -= 50;
          if (!hasEmail) atsScore -= 20;
          if (!hasPhone) atsScore -= 10;
          if (missingSections.length > 0) atsScore -= missingSections.length * 5;
          if (specialChars && specialChars.length > 100) atsScore -= 10;
          
          atsScore = Math.max(0, atsScore);

          return resolve(NextResponse.json({
            success: true,
            extracted_text: extractedText,
            metrics: {
              word_count: wordCount,
              char_count: charCount,
              line_count: lineCount,
              has_email: hasEmail,
              has_phone: hasPhone,
              sections_detected: sections
            },
            ats_score: atsScore,
            issues: issues.length > 0 ? issues : ['✅ Aucun problème détecté - PDF parfaitement extractible'],
            verdict: atsScore >= 90 ? '✅ EXCELLENT - ATS-Safe' :
                     atsScore >= 70 ? '⚠️ BON - Quelques améliorations possibles' :
                     atsScore >= 50 ? '⚠️ MOYEN - Problèmes à corriger' :
                     '❌ CRITIQUE - PDF non-compatible ATS'
          }));
        } catch (e: any) {
          console.error('[ats-simulator] JSON parse error:', outputData);
          return resolve(NextResponse.json({ error: 'Failed to parse python output', details: outputData }, { status: 500 }));
        }
      });
      
      pyProcess.on('error', (err) => {
        console.error('[ats-simulator] Python Process Error:', err);
        return resolve(NextResponse.json({ error: 'Failed to spawn Python process', details: err.message }, { status: 500 }));
      });
      
      pyProcess.stdin.on('error', (err: any) => {
        if (err.code !== 'EPIPE') {
          console.error('[ats-simulator] Python stdin error:', err);
        }
      });
      
      // Write binary data to python stdin
      try {
        pyProcess.stdin.write(pdfBuffer);
        pyProcess.stdin.end();
      } catch (err: any) {
        console.error('[ats-simulator] Failed to write to Python stdin:', err);
        return resolve(NextResponse.json({ error: 'Failed to send data to Python', details: err.message }, { status: 500 }));
      }
    });

  } catch (error: any) {
    console.error('[ats-simulator] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
