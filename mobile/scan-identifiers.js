// Keep OCR spelling unchanged: changing O/0 or I/1 could select the wrong part.
function scanIdentifiers(text) {
  const lines = String(text || '').slice(0, 20000).replace(/(\d)\s*[-–]\s*(?=[A-Z0-9])/gi, '$1-').split(/\r?\n/);
  const ranked = new Map();
  for (let i = 0; i < lines.length; i++) {
    const label = /\b(?:model(?:\s*(?:number|no\.?))?|part\s*(?:number|no\.?|#)|m\/n|p\/n|mpn|sku)\s*[:#.]?\s*$/i;
    const value = lines[i].replace(/https?:\/\/\S+/gi, '');
    if (/\b(serial|s\/n|volts?|watts?|hz|amps?|date)\b/i.test(value)) continue;
    for (const match of value.matchAll(/\b[A-Z0-9][A-Z0-9-]{1,29}\b/gi)) {
      const token = match[0].toUpperCase();
      const labelled = label.test(value.slice(0, match.index)) ||
        (i > 0 && match.index === value.search(/\S/) && label.test(lines[i-1]));
      if (/^\d+(?:V|W|HZ|A|MM|CM|KG|LB|PACK|PCS)$/i.test(token)) continue;
      const digits = (token.match(/\d/g) || []).length;
      const numeric = /^\d{3,}[A-Z]{0,3}(?:-[A-Z0-9]{1,12})*$/.test(token);
      const model = /^[A-Z]{1,8}(?:-[A-Z]{1,8})*-?\d[A-Z0-9]*(?:-[A-Z0-9]+)*$/.test(token);
      if (!numeric && !(model && (digits >= 2 || labelled))) continue;
      if (!labelled && /^\d{4}$/.test(token) && Number(token) >= 1900 && Number(token) <= 2099) continue;
      const score = (labelled ? 10 : 0) + (numeric && token.includes('-') ? 4 : digits >= 4 ? 3 : 1);
      ranked.set(token, Math.max(score, ranked.get(token) || 0));
    }
  }
  return [...ranked].sort((a,b) => b[1]-a[1]).slice(0,12).map(([value]) => value);
}
module.exports = { scanIdentifiers };
