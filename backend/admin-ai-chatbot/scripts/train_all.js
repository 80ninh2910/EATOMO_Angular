const { spawnSync } = require('child_process');
const path = require('path');

function run(target) {
  const script = path.join(__dirname, 'train_baseline.js');
  const result = spawnSync(process.execPath, [script, `--target=${target}`], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run('cancel');
run('delay');

console.log('[train-all] done');
