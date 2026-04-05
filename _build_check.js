const { spawnSync } = require('child_process');
const r = spawnSync('npx', ['vite', 'build'], {
  cwd: 'e:\\national-welding-works',
  encoding: 'utf8',
  shell: true,
});
console.log('EXIT:', r.status);
console.log('STDOUT:', r.stdout);
console.log('STDERR:', r.stderr);
