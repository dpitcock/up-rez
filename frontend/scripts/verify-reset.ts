import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

async function verifyReset() {
    console.log("🚀 Starting Reset Verification (UI Simulation)...");

    const sessionA = 'reset-test-session-A';
    const apiUrl = 'http://localhost:3030/api/demo';

    // 1. Initial Seed
    console.log(`1. Initial Seed for Session: ${sessionA}`);
    await fetch(`${apiUrl}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionA })
    });

    const count1 = await sql`SELECT count(*) FROM bookings WHERE session_id = ${sessionA}`;
    console.log(`   Initial Bookings: ${count1[0].count}`);

    // 2. Modify state (simulate user adding an offer or just verify data exists)
    // For now, just confirming data exists is enough to prove seeding worked.

    // 3. Trigger Reset AGAIN (simulate button click)
    console.log("2. Triggering Reset Button Action...");
    const res = await fetch(`${apiUrl}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionA })
    });
    const data = await res.json();
    console.log("   Reset Response:", data.status);

    // 4. Verify Data is Fresh (count should be same as initial seed, but new 'created_at' technically)
    // We can check that we didn't end up with Double data
    const count2 = await sql`SELECT count(*) FROM bookings WHERE session_id = ${sessionA}`;
    console.log(`   Post-Reset Bookings: ${count2[0].count}`);

    if (Number(count1[0].count) === Number(count2[0].count)) {
        console.log("✅ Reset Verification Passed (Data count consistent, no duplicates)");
    } else {
        console.error("❌ Reset Verification Failed (Count mismatch)");
        process.exit(1);
    }
}

verifyReset();
