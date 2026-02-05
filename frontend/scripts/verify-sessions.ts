import { db } from '../lib/db';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

async function verifySessions() {
    console.log("🚀 Starting Session Verification...");

    const sessionA = 'test-session-A';
    const sessionB = 'test-session-B';

    // Helper to call reset API (simulated via direct DB or fetch if running)
    // Since we are inside the app context/container, we might not have 'fetch' to localhost easy if port mapping varies
    // But we can verify by invoking the helper logic or just checking DB isolation manually.
    // Ideally we call the API to test the full flow.

    // Let's assume the API is running at http://localhost:3030
    const apiUrl = 'http://localhost:3030/api/demo/reset';

    console.log(`1. Seeding Session A: ${sessionA}`);
    try {
        const resA = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionA })
        });
        if (!resA.ok) throw new Error(`Failed to seed A: ${resA.statusText}`);
    } catch (e) {
        console.error("API Call Failed. Ensure server is running.", e);
        // Fallback: This script might check DB assuming external seed? 
        // Or we can try to run the seed logic here? 
        // No, let's rely on API.
        return;
    }

    console.log(`2. Seeding Session B: ${sessionB}`);
    try {
        const resB = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionB })
        });
        if (!resB.ok) throw new Error(`Failed to seed B: ${resB.statusText}`);
    } catch (e) {
        return;
    }

    console.log("3. Verifying DB Isolation...");

    // Check Session A
    const bookingsA = await sql`SELECT * FROM bookings WHERE session_id = ${sessionA}`;
    console.log(`   Session A Bookings: ${bookingsA.length}`);
    if (bookingsA.length === 0) console.error("❌ Session A empty!");

    // Check Session B
    const bookingsB = await sql`SELECT * FROM bookings WHERE session_id = ${sessionB}`;
    console.log(`   Session B Bookings: ${bookingsB.length}`);
    if (bookingsB.length === 0) console.error("❌ Session B empty!");

    // Check global (should be empty if we migrated everything to session? Or old global data persists?)
    // The reset script creates global data if no session_id, but here we used session_id.

    // Verify Date Calculation
    if (bookingsA.length > 0) {
        const b = bookingsA[0];
        console.log(`   Sample Booking A: ${b.id}, Arrival: ${b.arrival_date}`);
        const arrival = new Date(b.arrival_date);
        const now = new Date();
        const diffDays = Math.floor((arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   Days from now: ~${diffDays}`);
        if (diffDays < 0) console.warn("⚠️ Booking in past?");
    }

    console.log("✅ Verification Complete");
}

verifySessions();
