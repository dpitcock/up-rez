const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

async function check() {
    try {
        const props = await sql`SELECT id, name, images FROM properties LIMIT 5`;
        console.log('Properties:', JSON.stringify(props, null, 2));

        const offers = await sql`SELECT id, booking_id, top3 FROM offers ORDER BY created_at DESC LIMIT 1`;
        console.log('Latest Offer:', JSON.stringify(offers, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
