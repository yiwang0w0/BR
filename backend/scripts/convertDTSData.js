const fs = require('fs');
const parser = require('php-parser');

function phpVal(node) {
  if (!node) return null;
  switch (node.kind) {
    case 'string':
      return node.value;
    case 'number':
      return Number(node.value);
    case 'boolean':
      return node.value;
    case 'array': {
      const arr = [];
      const obj = {};
      let has = false;
      for (const item of node.items) {
        const v = phpVal(item.value);
        if (item.key) {
          has = true;
          obj[item.key.value] = v;
        } else arr.push(v);
      }
      return has ? obj : arr;
    }
    default:
      return null;
  }
}

function parseVariable(file, name) {
  const code = fs.readFileSync(file, 'utf8');
  const engine = new parser.Engine({ parser: { php7: true } });
  const ast = engine.parseCode(code);
  let res = null;
  const walk = n => {
    if (!n || res) return;
    if (n.kind === 'assign' && n.left.kind === 'variable' && n.left.name === name) {
      res = phpVal(n.right);
      return;
    }
    for (const k in n) {
      const c = n[k];
      if (Array.isArray(c)) c.forEach(walk);
      else if (c && typeof c === 'object') walk(c);
    }
  };
  walk(ast);
  return res;
}

function parseMapItems(file) {
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('//') && !l.startsWith('<?') && !l.startsWith('?>'))
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.split(',').map(s => s.trim()));
}

function main() {
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  const mixinfo = parseVariable('../DTS/include/modules/base/itemmix/itemmix/config/itemmix.config.php', 'mixinfo');
  fs.writeFileSync('data/itemmix.json', JSON.stringify(mixinfo, null, 2));
  const mapitems = parseMapItems('../DTS/include/modules/base/itemmain/config/mapitem.config.php');
  fs.writeFileSync('data/mapitems.json', JSON.stringify(mapitems, null, 2));
  console.log('Converted', mixinfo.length, 'recipes and', mapitems.length, 'map items.');
}

if (require.main === module) {
  main();
}
