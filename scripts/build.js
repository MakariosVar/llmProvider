import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve('.');
const DIST = resolve('dist');

mkdirSync(DIST, { recursive: true });

// 1. Build Vue client
console.log('Building client...');
execSync('npm run build', { cwd: 'client', stdio: 'inherit' });

// 2. Bundle server + dashboard with esbuild into ESM at project root
//    (so __dirname inside pkg snapshot points to project root, not dist/)
console.log('Bundling server...');
execSync(
  `npx esbuild src/cli.js --bundle --platform=node --target=node22 ` +
  `--outfile=${ROOT}/bundle.mjs --format=esm ` +
  `--external:better-sqlite3 --external:term.js --external:pty.js ` +
  `--external:blessed --external:blessed-contrib`,
  { stdio: 'inherit' }
);

// 3. Compile standalone executable with pkg
console.log('Compiling executable...');
execSync(
  `npx pkg ${ROOT}/bundle.mjs --config package.json --output=${DIST}/llm-provider-server`,
  { stdio: 'inherit', timeout: 300000 }
);

// 4. Copy .env for user configuration
console.log('Copying .env...');
copyFileSync('.env.example', `${DIST}/.env`);

// 5. Clean up intermediate bundle
rmSync(`${ROOT}/bundle.mjs`);

console.log('\nBuild complete! Files in dist/:');
execSync(`ls -lhA ${DIST}`);
