/**
 * Build-time script to verify that demo-data.json exists and contains templates.
 */
const fs = require('fs');
const path = require('path');

function verifyData() {
    const dataPath = path.join(__dirname, '../public/demo-data.json');

    if (!fs.existsSync(dataPath)) {
        console.warn('⚠️  demo-data.json not found! Vercel mock mode will fail.');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        if (!data.offer_templates || data.offer_templates.length === 0) {
            console.warn('⚠️  demo-data.json missing offer_templates! AI offers will not work in mock mode.');
        } else {
            console.log(`✅ demo-data.json verified: ${data.offer_templates.length} templates found.`);
        }

        if (!data.metadata || !data.metadata.snapshot_at) {
            console.warn('⚠️  demo-data.json missing snapshot metadata! Date normalization might fail.');
        }
    } catch (e) {
        console.error('❌ Failed to parse demo-data.json:', e.message);
    }
}

verifyData();
