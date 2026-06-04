const { spawn } = require('child_process');
const { exec } = require('child_process');

// Start Next.js dev server
const nextProcess = spawn('npx', ['next', 'dev', '-p', '3001'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let browserOpened = false;

// Watch stdout for the local URL and open it
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output); // still print to terminal

  if (!browserOpened) {
    // Match "Local: http://localhost:XXXX"
    const match = output.match(/Local:\s+(http:\/\/localhost:\d+)/);
    if (match) {
      const url = match[1];
      browserOpened = true;
      console.log(`\n🚀 Opening browser at ${url}...\n`);
      // Windows: use 'start', Mac: 'open', Linux: 'xdg-open'
      exec(`start ${url}`, (err) => {
        if (err) exec(`open ${url}`, (err2) => {
          if (err2) exec(`xdg-open ${url}`);
        });
      });
    }
  }
});

nextProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

nextProcess.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
  process.exit(0);
});
