import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

async function verifyCleanup() {
    console.log("🚀 Starting Cleanup Verification...");

    const staleSession = 'stale-session-1';
    const freshSession = 'fresh-session-1';
    const apiUrl = 'http://localhost:3030/api/demo';

    // 1. Seed Stale Session
    console.log(`1. Seeding Stale Session: ${staleSession}`);
    await fetch(`${apiUrl}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: staleSession })
    });

    // Manually age the data in DB (hacky but necessary for testing time-based deletion)
    console.log("   Aging stale session data by 48 hours...");
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await sql`UPDATE bookings SET created_at = ${twoDaysAgo} WHERE session_id = ${staleSession}`;
    await sql`UPDATE offers SET created_at = ${twoDaysAgo} WHERE session_id = ${staleSession}`;

    // 2. Seed Fresh Session
    console.log(`2. Seeding Fresh Session: ${freshSession}`);
    await fetch(`${apiUrl}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: freshSession })
    });

    // 3. Trigger Cleanup
    console.log("3. Triggering Cleanup...");
    const cleanupRes = await fetch(`${apiUrl}/cleanup`, {
        method: 'POST'
    });
    const cleanupData = await cleanupRes.json();
    console.log("   Cleanup Result:", cleanupData);

    // 4. Verify Database State
    console.log("4. Verifying DB State...");

    const staleCount = await sql`SELECT count(*) FROM bookings WHERE session_id = ${staleSession}`;
    const freshCount = await sql`SELECT count(*) FROM bookings WHERE session_id = ${freshSession}`;

    console.log(`   Stale Bookings Remaining: ${staleCount[0].count} (Expected: 0)`);
    console.log(`   Fresh Bookings Remaining: ${freshCount[0].count} (Expected: >0)`);

    if (Number(staleCount[0].count) === 0 && Number(freshCount[0].count) > 0) {
        console.log("✅ Cleanup Verification Passed!");
    } else {
        console.error("❌ Cleanup Verification Failed");
        process.exit(1);
    }
}

verifyCleanup();
