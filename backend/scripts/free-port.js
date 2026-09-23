const { execSync } = require('child_process');

const PORT = process.argv[2] || process.env.PORT || 5000;

function freePort(port) {
    try {
        if (process.platform === 'win32') {
            const output = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
            const lines = output.trim().split('\r\n');
            const pids = new Set();
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const localAddr = parts[1] || '';
                const pid = parts[parts.length - 1];
                if ((localAddr.endsWith(`:${port}`) || localAddr.includes(`:${port}`)) && pid && pid !== '0' && !isNaN(pid)) {
                    if (parseInt(pid, 10) !== process.pid) {
                        pids.add(pid);
                    }
                }
            }
            for (const pid of pids) {
                try {
                    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                    console.log(`[prestart] Freed port ${port} by terminating lingering process (PID ${pid}).`);
                } catch (e) {}
            }
        } else {
            try {
                execSync(`npx --yes kill-port ${port}`, { stdio: 'ignore' });
            } catch (e) {}
        }
    } catch (err) {
        // Port was likely clear
    }
}

freePort(PORT);
