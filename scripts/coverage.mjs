#!/usr/bin/env node
/**
 * Coverage measurement script for Calendeers
 * 
 * Uses c8 to instrument code and measure coverage during test execution.
 * This approach properly instruments the source files before Mocha runs.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function clean(...dirs) {
  for (const dir of dirs) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
}

function ensureDir(...dirs) {
  for (const dir of dirs) {
    fs.mkdirSync(path.join(rootDir, dir), { recursive: true });
  }
}

async function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: rootDir,
      stdio: options.stdio || 'inherit',
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('\n Calendeers Test Coverage Measurement\n');
  console.log('Step 1: Cleaning old coverage data...');
  clean('.nyc_output', 'coverage');
  ensureDir('coverage');

  console.log('Step 2: Running tests with c8 coverage instrumentation...\n');
  try {
    
    await runCommand('npx', [
      'c8',
      '--all',
      '--include=src/**/*.js',
      '--exclude=**/node_modules/**',
      '--exclude=**/tests/**',
      '--exclude=.nyc_output/**',
      '--exclude=coverage/**',
      '--reporter=text',
      '--reporter=html',
      '--reporter=lcov',
      '--report-dir=./coverage',
      'node',
      '--enable-source-maps',
      './node_modules/.bin/mocha',
      './tests/*.spec.js',
      '--exit'
    ]);
  } catch (err) {
    console.error('Tests or coverage measurement failed:', err.message);
    process.exit(1);
  }

  console.log('\n Coverage report generated successfully!');
  console.log(' HTML Report: ./coverage/index.html');
  console.log(' LCOV Report: ./coverage/lcov.info\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
