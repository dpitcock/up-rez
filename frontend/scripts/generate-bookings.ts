import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Run with: npx ts-node scripts/generate-bookings.ts

const DATA_DIR = path.join(__dirname, '../../initial_data');
const PROP_FILE = path.join(DATA_DIR, 'properties.json');
const BOOK_FILE = path.join(DATA_DIR, 'bookings.json');

const GUEST_NAMES = [
    "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
    "Fiona Gallagher", "George Martin", "Hannah Abbott", "Ian McKellen", "Julia Roberts"
];

function generateBookings() {
    console.log("🚀 Generating realistic dummy bookings (TypeScript)...");

    if (!fs.existsSync(PROP_FILE)) {
        console.error(`❌ Properties file not found at ${PROP_FILE}`);
        return;
    }

    const properties = JSON.parse(fs.readFileSync(PROP_FILE, 'utf-8'));
    const bookings = [];

    for (const prop of properties) {
        // Create 1-3 bookings per property
        const numBookings = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numBookings; i++) {
            const daysAhead = Math.floor(Math.random() * 54) + 7; // 7-60 days
            const arrival = new Date();
            arrival.setDate(arrival.getDate() + daysAhead);

            const nights = Math.floor(Math.random() * 8) + 3; // 3-10 nights
            const departure = new Date(arrival);
            departure.setDate(departure.getDate() + nights);

            const pricePerNight = prop.price || 150;
            const totalPaid = pricePerNight * nights;
            const bookingId = `book_${uuidv4().split('-')[0]}`;

            const booking = {
                id: bookingId,
                prop_id: prop.id,
                arrival_date: arrival.toISOString().split('T')[0],
                departure_date: departure.toISOString().split('T')[0],
                nights: nights,
                guest_name: GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)],
                guest_email: `dpitcock.dev+${bookingId}@gmail.com`,
                guest_country: ["US", "UK", "DE", "FR", "ES"][Math.floor(Math.random() * 5)],
                adults: Math.floor(Math.random() * (prop.maxGuests || 2)) + 1,
                children: Math.floor(Math.random() * 3),
                base_nightly_rate: pricePerNight,
                total_paid: totalPaid,
                channel: ["airbnb", "booking", "direct"][Math.floor(Math.random() * 3)],
                status: 'confirmed',
                created_at: new Date().toISOString()
            };
            bookings.push(booking);
        }
    }

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(BOOK_FILE, JSON.stringify(bookings, null, 4));
    console.log(`✓ Generated ${bookings.length} bookings.`);
    console.log(`💾 Saved to ${BOOK_FILE}`);
}

generateBookings();
