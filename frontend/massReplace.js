const fs = require('fs');
const path = require('path');

const walksDir = (dir, ext) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walksDir(file, ext));
    } else {
      if (file.endsWith(ext)) results.push(file);
    }
  });
  return results;
}

const files = walksDir(path.join(__dirname, 'src'), '.jsx');

const replacements = [
  { p: /'#020D05'/g, r: "'var(--bg)'" },
  { p: /"#020D05"/g, r: "'var(--bg)'" },
  { p: /'#040F07'/g, r: "'var(--bg-deep)'" },
  { p: /"#040F07"/g, r: "'var(--bg-deep)'" },
  { p: /'#071A0C'/g, r: "'var(--bg-card)'" },
  { p: /"#071A0C"/g, r: "'var(--bg-card)'" },
  { p: /'#0D2914'/g, r: "'var(--bg-elevated)'" },
  { p: /"#0D2914"/g, r: "'var(--bg-elevated)'" },
  { p: /'#1F5C2E'/g, r: "'var(--bg-hover)'" },
  { p: /"#1F5C2E"/g, r: "'var(--bg-hover)'" },

  { p: /'#1A4A25'/g, r: "'var(--border)'" },
  { p: /"#1A4A25"/g, r: "'var(--border)'" },
  { p: /'rgba\(34, 197, 94, 0\.2\)'/g, r: "'var(--border)'" },
  { p: /'rgba\(34,197,94,0\.2\)'/g, r: "'var(--border)'" },
  { p: /'rgba\(34,197,94,0\.3\)'/g, r: "'var(--border-hover)'" },

  { p: /'#22C55E'/g, r: "'var(--primary)'" },
  { p: /"#22C55E"/g, r: "'var(--primary)'" },
  { p: /'rgba\(34,197,94,0\.4\)'/g, r: "'var(--primary-dim)'" },
  { p: /'#4ADE80'/g, r: "'var(--secondary)'" },
  { p: /"#4ADE80"/g, r: "'var(--secondary)'" },
  { p: /'#86EFAC'/g, r: "'var(--tertiary)'" },
  { p: /"#86EFAC"/g, r: "'var(--tertiary)'" },

  { p: /'#D1FAE5'/g, r: "'var(--text-primary)'" },
  { p: /"#D1FAE5"/g, r: "'var(--text-primary)'" },
  { p: /'rgba\(110,231,183,0\.6\)'/g, r: "'var(--text-second)'" },

  // Catch bare strings for interpolation
  { p: /#22C55E/g, r: "var(--primary)" },
  { p: /#4ADE80/g, r: "var(--secondary)" },
  { p: /#86EFAC/g, r: "var(--tertiary)" },
  { p: /#020D05/g, r: "var(--bg)" },
  { p: /#040F07/g, r: "var(--bg-deep)" },
  { p: /#071A0C/g, r: "var(--bg-card)" },
  { p: /#0D2914/g, r: "var(--bg-elevated)" },
  { p: /#1F5C2E/g, r: "var(--bg-hover)" },
  { p: /#1A4A25/g, r: "var(--border)" },
  { p: /#D1FAE5/g, r: "var(--text-primary)" },
  { p: /rgba\(34,197,94,0\.4\)/g, r: "var(--text-muted)" },
  { p: /rgba\(110,231,183,0\.6\)/g, r: "var(--text-second)" },
  { p: /rgba\(34,197,94,0\.3\)/g, r: "var(--border-hover)" },
  { p: /rgba\(34,197,94,0\.2\)/g, r: "var(--primary-glow)" }
];

let changedCount = 0;

files.forEach(f => {
  if (f.includes('VineIntro.jsx')) return; // do not touch VineIntro.jsx
  if (f.includes('EcoBg.jsx')) return; // do not touch EcoBg.jsx
  if (f.includes('ThemeContext.jsx')) return; // do not touch ThemeContext.jsx

  let content = fs.readFileSync(f, 'utf-8');
  let original = content;

  replacements.forEach(({p, r}) => {
    content = content.replace(p, r);
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf-8');
    changedCount++;
    console.log(`Updated ${path.basename(f)}`);
  }
});

console.log(`Total files updated: ${changedCount}`);
