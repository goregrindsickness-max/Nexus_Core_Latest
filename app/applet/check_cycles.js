const fs = require('fs');
const path = require('path');

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(f)) files.push(full);
  }
}
walk('src');

const graph = {};
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const imports = [];
  const re = /(?:import|export)\s+.*?from\s+["'](\..*?)["']/g;
  let match;
  while ((match = re.exec(code)) !== null) {
    let rel = match[1];
    let resolved = path.resolve(path.dirname(file), rel);
    if (fs.existsSync(resolved + '.ts')) resolved += '.ts';
    else if (fs.existsSync(resolved + '.tsx')) resolved += '.tsx';
    else if (fs.existsSync(resolved + '/index.ts')) resolved += '/index.ts';
    else if (fs.existsSync(resolved + '/index.tsx')) resolved += '/index.tsx';
    imports.push(resolved);
  }
  graph[file] = imports;
}

const reported = new Set();
function findCycles(node, visited = new Set(), pathStack = []) {
  visited.add(node);
  pathStack.push(node);

  for (const neighbor of graph[node] || []) {
    if (!pathStack.includes(neighbor)) {
      if (!visited.has(neighbor)) {
        findCycles(neighbor, visited, [...pathStack]);
      }
    } else {
      const cycle = pathStack.slice(pathStack.indexOf(neighbor));
      const key = cycle.slice().sort().join('|');
      if (!reported.has(key)) {
        reported.add(key);
        console.log('CYCLE DETECTED:\n  ' + cycle.map(p => path.relative(process.cwd(), p)).join('\n  -> ') + '\n  -> ' + path.relative(process.cwd(), neighbor));
      }
    }
  }
}

for (const file of files) {
  findCycles(file);
}
console.log('Finished cycle check. Total cycles:', reported.size);
