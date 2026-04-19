'use client';

import { useState, useMemo } from 'react';
import { ArrowRight, Check, X, AlertCircle } from 'lucide-react';

// Myers' diff algorithm implementation
function myersDiff(a: string[], b: string[]): Array<{type: 'add' | 'del' | 'eq', line: string}> {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const v: {[k: number]: number} = {1: 0};
  const trace: Array<{[k: number]: number}> = [];

  for (let d = 0; d <= max; d++) {
    trace.push({...v});
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        x = v[k + 1];
      } else {
        x = v[k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[k] = x;
      if (x >= n && y >= m) {
        return backtrack(a, b, trace, d);
      }
    }
  }
  return [];
}

function backtrack(a: string[], b: string[], trace: Array<{[k: number]: number}>, d: number) {
  const result: Array<{type: 'add' | 'del' | 'eq', line: string}> = [];
  let x = a.length;
  let y = b.length;

  for (let depth = d; depth >= 0; depth--) {
    const v = trace[depth];
    const k = x - y;
    let prevK: number;
    if (k === -depth || (k !== depth && v[k - 1] < v[k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = v[prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      result.unshift({type: 'eq', line: a[x - 1]});
      x--;
      y--;
    }

    if (depth > 0) {
      if (x === prevX) {
        result.unshift({type: 'add', line: b[y - 1]});
        y--;
      } else {
        result.unshift({type: 'del', line: a[x - 1]});
        x--;
      }
    }
  }
  return result;
}

// Word-level diff for modified lines
function wordDiff(oldText: string, newText: string): Array<{type: 'add' | 'del' | 'eq', text: string}> {
  const oldWords = oldText.split(/\b/);
  const newWords = newText.split(/\b/);
  const diff = myersDiff(oldWords, newWords);
  return diff.map(d => ({type: d.type === 'del' ? 'del' : d.type === 'add' ? 'add' : 'eq', text: d.line}));
}

interface CVComparisonProps {
  originalCV: string;
  optimizedCV: any; // JSON structure
}

export default function CVComparison({ originalCV, optimizedCV }: CVComparisonProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('unified');

  // Convert optimized CV JSON to readable text
  const optimizedText = useMemo(() => {
    if (!optimizedCV) return '';
    
    let text = '';
    
    // Header
    if (optimizedCV.name) text += `${optimizedCV.name.toUpperCase()}\n`;
    if (optimizedCV.title) text += `${optimizedCV.title}\n`;
    if (optimizedCV.email || optimizedCV.phone || optimizedCV.location || optimizedCV.linkedin || optimizedCV.github || optimizedCV.portfolio || optimizedCV.website) {
      text += `${[optimizedCV.email, optimizedCV.phone, optimizedCV.location, optimizedCV.linkedin, optimizedCV.github, optimizedCV.portfolio, optimizedCV.website].filter(Boolean).join(' | ')}\n`;
    }
    text += '\n';

    // Summary
    if (optimizedCV.summary) {
      text += 'RÉSUMÉ PROFESSIONNEL\n';
      text += `${optimizedCV.summary}\n\n`;
    }

    // Experience
    if (optimizedCV.experiences?.length > 0) {
      text += 'EXPÉRIENCE PROFESSIONNELLE\n';
      optimizedCV.experiences.forEach((exp: any) => {
        text += `${exp.role}\n`;
        text += `${exp.company} | ${exp.location} | ${exp.period}\n`;
        exp.bullets?.forEach((bullet: string) => {
          text += `• ${bullet}\n`;
        });
        text += '\n';
      });
    }

    // Education
    if (optimizedCV.education?.length > 0) {
      text += 'FORMATION\n';
      optimizedCV.education.forEach((edu: any) => {
        text += `${edu.degree}\n`;
        text += `${edu.school} | ${edu.year}\n`;
        if (edu.detail) text += `${edu.detail}\n`;
        text += '\n';
      });
    }

    // Skills
    if (optimizedCV.skills?.categories?.length > 0) {
      text += 'COMPÉTENCES\n';
      optimizedCV.skills.categories.forEach((cat: any) => {
        text += `${cat.name}: ${cat.items.join(', ')}\n`;
      });
      text += '\n';
    }

    // Languages
    if (optimizedCV.languages?.length > 0) {
      text += 'LANGUES\n';
      optimizedCV.languages.forEach((lang: any) => {
        text += `• ${lang.lang} - ${lang.level}\n`;
      });
      text += '\n';
    }

    // Certifications
    if (optimizedCV.certifications?.length > 0) {
      text += 'CERTIFICATIONS\n';
      optimizedCV.certifications.forEach((cert: string) => {
        text += `• ${cert}\n`;
      });
      text += '\n';
    }

    // Interests
    if (optimizedCV.interests?.length > 0) {
      text += 'CENTRES D\'INTÉRÊT\n';
      text += optimizedCV.interests.join(' | ') + '\n';
      text += '\n';
    }

    return text.trim();
  }, [optimizedCV]);

  // Myers' diff with word-level detection
  const getDiff = useMemo(() => {
    const originalLines = originalCV.split('\n');
    const optimizedLines = optimizedText.split('\n');
    
    const lineDiff = myersDiff(originalLines, optimizedLines);
    
    const enhanced: Array<{ 
      type: 'added' | 'removed' | 'unchanged' | 'modified', 
      content: string,
      oldContent?: string,
      wordDiff?: Array<{type: 'add' | 'del' | 'eq', text: string}>
    }> = [];
    
    // DP alignment preserving order on the ENTIRE CV lines
    const dp: number[][] = [];
    for (let r = 0; r <= originalLines.length; r++) {
       dp[r] = new Array(optimizedLines.length + 1).fill(0);
    }
    
    // Fill DP
    for (let r = 1; r <= originalLines.length; r++) {
       for (let c = 1; c <= optimizedLines.length; c++) {
          const l1 = originalLines[r-1].trim();
          const l2 = optimizedLines[c-1].trim();
          
          let sim = 0;
          if (l1 === l2) {
             sim = 1.0;
          } else if (l1.length > 0 && l2.length > 0) {
             sim = getSimilarity(l1, l2);
          }
          
          const matchScore = sim >= 0.05 ? dp[r-1][c-1] + sim : dp[r-1][c-1];
          dp[r][c] = Math.max(dp[r-1][c], dp[r][c-1], matchScore);
       }
    }
    
    const pairs: [number, number][] = [];
    let rIdx = originalLines.length;
    let cIdx = optimizedLines.length;
    while (rIdx > 0 && cIdx > 0) {
       const l1 = originalLines[rIdx-1].trim();
       const l2 = optimizedLines[cIdx-1].trim();
       
       let sim = 0;
       if (l1 === l2) sim = 1.0;
       else if (l1.length > 0 && l2.length > 0) sim = getSimilarity(l1, l2);
       
       if (sim >= 0.05 && Math.abs(dp[rIdx][cIdx] - (dp[rIdx-1][cIdx-1] + sim)) < 0.001) {
          pairs.unshift([rIdx-1, cIdx-1]);
          rIdx--;
          cIdx--;
       } else if (dp[rIdx][cIdx] === dp[rIdx-1][cIdx]) {
          rIdx--;
       } else {
          cIdx--;
       }
    }
    
    const usedDels = new Set<number>();
    const usedAdds = new Set<number>();
    for (const [delIdx, addIdx] of pairs) {
       usedDels.add(delIdx);
       usedAdds.add(addIdx);
    }
    
    // Merge sequentially
    let d = 0, a = 0;
    while (d < originalLines.length || a < optimizedLines.length) {
       if (d < originalLines.length && !usedDels.has(d)) {
          enhanced.push({ type: 'removed', content: originalLines[d] });
          d++;
       } else if (a < optimizedLines.length && !usedAdds.has(a)) {
          enhanced.push({ type: 'added', content: optimizedLines[a] });
          a++;
       } else if (d < originalLines.length && a < optimizedLines.length && usedDels.has(d) && usedAdds.has(a)) {
          if (originalLines[d].trim() === optimizedLines[a].trim()) {
             enhanced.push({ type: 'unchanged', content: optimizedLines[a] });
          } else {
             enhanced.push({
                type: 'modified',
                content: optimizedLines[a],
                oldContent: originalLines[d],
                wordDiff: wordDiff(originalLines[d], optimizedLines[a])
             });
          }
          d++;
          a++;
       } else {
          if (d < originalLines.length) { enhanced.push({ type: 'removed', content: originalLines[d] }); d++; }
          if (a < optimizedLines.length) { enhanced.push({ type: 'added', content: optimizedLines[a] }); a++; }
       }
    }
    
    return enhanced;
  }, [originalCV, optimizedText]);

  // Levenshtein similarity
  function getSimilarity(a: string, b: string): number {
    if (!a.length || !b.length) return 0;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[b.length][a.length];
    return 1 - distance / Math.max(a.length, b.length);
  }

  const stats = useMemo(() => {
    const added = getDiff.filter(d => d.type === 'added').length;
    const removed = getDiff.filter(d => d.type === 'removed').length;
    const modified = getDiff.filter(d => d.type === 'modified').length;
    const unchanged = getDiff.filter(d => d.type === 'unchanged').length;
    
    return { added, removed, modified, unchanged, total: added + removed + modified + unchanged };
  }, [getDiff]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem',
        background: 'var(--surface)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>📊 CV Comparison</h3>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--text3)' }}>
            Avant/Après optimisation AI
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: viewMode === 'unified' ? 'var(--gold)' : 'var(--surface)',
              color: viewMode === 'unified' ? '#000' : 'var(--text2)',
              border: `1px solid ${viewMode === 'unified' ? 'var(--gold)' : 'var(--border)'}`,
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Unifié
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: viewMode === 'side-by-side' ? 'var(--gold)' : 'var(--surface)',
              color: viewMode === 'side-by-side' ? '#000' : 'var(--text2)',
              border: `1px solid ${viewMode === 'side-by-side' ? 'var(--gold)' : 'var(--border)'}`,
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Côte à côte
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '1rem' 
      }}>
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--r-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>+{stats.added}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>Ajoutées</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--r-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444' }}>-{stats.removed}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>Supprimées</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(251, 191, 36, 0.1)', 
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 'var(--r-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FBB024' }}>~{stats.modified}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>Modifiées</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'var(--surface)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text2)' }}>{stats.unchanged}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>Inchangées</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'var(--surface)', 
          border: '1px solid var(--gold)',
          borderRadius: 'var(--r-md)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>
            {Math.round(((stats.added + stats.modified) / stats.total) * 100)}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>Amélioration</div>
        </div>
      </div>

      {/* Comparison View */}
      {viewMode === 'side-by-side' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          minHeight: '600px'
        }}>
          {/* Original */}
          <div style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '0.8rem 1rem', 
              background: 'rgba(239, 68, 68, 0.1)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <X size={16} color="#EF4444" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>ORIGINAL CV</span>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              lineHeight: '1.8',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {getDiff.filter(d => d.type !== 'added').map((line, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: line.type === 'removed' ? 'rgba(239, 68, 68, 0.1)' : 
                               line.type === 'modified' ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                    borderLeft: line.type === 'removed' ? '3px solid #EF4444' : 
                               line.type === 'modified' ? '3px solid #FBB024' : 'none',
                    paddingLeft: line.type === 'removed' || line.type === 'modified' ? '12px' : '15px',
                    color: line.type === 'removed' ? '#EF4444' : 'var(--text2)',
                    textDecoration: line.type === 'removed' ? 'line-through' : 'none',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '2px'
                  }}
                >
                  {line.type === 'removed' && '- '}
                  {line.type === 'modified' && '~ '}
                  {line.type === 'modified' && line.wordDiff ? (
                    <span>
                      {line.wordDiff.map((w, i) => (
                        <span key={i} style={{
                          background: w.type === 'del' ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                          textDecoration: w.type === 'del' ? 'line-through' : 'none',
                          color: w.type === 'del' ? '#EF4444' : 'inherit'
                        }}>{w.text}</span>
                      ))}
                    </span>
                  ) : (line.oldContent || line.content || ' ')}
                </div>
              ))}
            </div>
          </div>

          {/* Optimized */}
          <div style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '0.8rem 1rem', 
              background: 'rgba(16, 185, 129, 0.1)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} color="#10B981" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>OPTIMIZED CV</span>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              lineHeight: '1.8',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {getDiff.filter(d => d.type !== 'removed').map((line, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: line.type === 'added' ? 'rgba(16, 185, 129, 0.1)' : 
                               line.type === 'modified' ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                    borderLeft: line.type === 'added' ? '3px solid #10B981' : 
                               line.type === 'modified' ? '3px solid #FBB024' : 'none',
                    paddingLeft: line.type === 'added' || line.type === 'modified' ? '12px' : '15px',
                    color: line.type === 'added' ? '#10B981' : 'var(--text2)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '2px'
                  }}
                >
                  {line.type === 'added' && '+ '}
                  {line.type === 'modified' && '~ '}
                  {line.type === 'modified' && line.wordDiff ? (
                    <span>
                      {line.wordDiff.map((w, i) => (
                        <span key={i} style={{
                          background: w.type === 'add' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                          fontWeight: w.type === 'add' ? 600 : 'normal',
                          color: w.type === 'add' ? '#10B981' : 'inherit'
                        }}>{w.text}</span>
                      ))}
                    </span>
                  ) : (line.content || ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '0.8rem 1rem', 
            background: 'var(--surface-subtle)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ArrowRight size={16} color="var(--gold)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>UNIFIED DIFF VIEW</span>
          </div>
          <div style={{ 
            padding: '1.5rem', 
            fontFamily: 'monospace', 
            fontSize: '0.75rem', 
            lineHeight: '1.8',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {getDiff.map((line, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: line.type === 'added' ? 'rgba(16, 185, 129, 0.1)' : 
                             line.type === 'removed' ? 'rgba(239, 68, 68, 0.1)' : 
                             line.type === 'modified' ? 'rgba(251, 191, 36, 0.08)' : 
                             'transparent',
                  borderLeft: line.type === 'added' ? '3px solid #10B981' : 
                             line.type === 'removed' ? '3px solid #EF4444' : 
                             line.type === 'modified' ? '3px solid #FBB024' : 
                             'none',
                  paddingLeft: line.type !== 'unchanged' ? '12px' : '15px',
                  color: line.type === 'added' ? '#10B981' : 
                        line.type === 'removed' ? '#EF4444' : 
                        line.type === 'modified' ? '#FBB024' : 
                        'var(--text2)',
                  textDecoration: line.type === 'removed' ? 'line-through' : 'none',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '2px'
                }}
              >
                {line.type === 'added' && '+ '}
                {line.type === 'removed' && '- '}
                {line.type === 'modified' && '~ '}
                {line.type === 'modified' && line.wordDiff ? (
                  <span>
                    {line.wordDiff.map((w, i) => (
                      <span key={i} style={{
                        background: w.type === 'add' ? 'rgba(16, 185, 129, 0.3)' : 
                                   w.type === 'del' ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                        textDecoration: w.type === 'del' ? 'line-through' : 'none',
                        fontWeight: w.type === 'add' ? 600 : 'normal',
                        color: w.type === 'add' ? '#10B981' : w.type === 'del' ? '#EF4444' : 'inherit'
                      }}>{w.text}</span>
                    ))}
                  </span>
                ) : (line.content || ' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        justifyContent: 'center',
        padding: '1rem',
        background: 'var(--surface)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        fontSize: '0.7rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, background: 'rgba(16, 185, 129, 0.3)', borderRadius: '2px' }}></div>
          <span>Ajouté</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.3)', borderRadius: '2px' }}></div>
          <span>Supprimé</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, background: 'rgba(251, 191, 36, 0.3)', borderRadius: '2px' }}></div>
          <span>Modifié (word-level)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={12} color="var(--gold)" />
          <span>Myers' diff algorithm</span>
        </div>
      </div>
    </div>
  );
}
