/**
 * Build-time script to trigger a data snapshot from the backend.
 * Only runs during local development builds to update demo-data.json.
 */
const http = require('http');

async function triggerSnapshot() {
    // Skip if on production/Vercel build (they won't have local backend access)
    // We check VERCEL environment variable which is automatically set by Vercel
    if (process.env.VERCEL || process.env.NODE_ENV === 'production' && !process.env.FORCE_SNAPSHOT) {
        console.log('⏭️ Skipping data snapshot (Production/Vercel build detected)');
        return;
    }

    console.log('🔄 Triggering local data snapshot...');

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const endpoint = `${backendUrl}/demo/export-snapshot`;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(endpoint, options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const response = JSON.parse(body);
                    const fs = require('fs');
                    const path = require('path');
                    const targetFile = path.join(__dirname, '../public/demo-data.json');

                    fs.writeFileSync(targetFile, JSON.stringify(response.data, null, 2));
                    console.log(`✅ Data snapshot updated at ${targetFile}`);
                } catch (e) {
                    console.error('❌ Failed to process snapshot data:', e.message);
                }
            } else {
                console.warn(`⚠️ Snapshot trigger failed (Status: ${res.statusCode}):`, body);
                console.warn('Continuing build with existing data if available...');
            }
        });
    });

    req.on('error', (err) => {
        console.warn('⚠️ Could not reach backend for snapshot update:', err.message);
        console.warn('Proceeding with build using stale demo-data.json...');
    });

    req.end();
}

triggerSnapshot();
