import * as fs from 'fs';
import * as path from 'path';

// Configuration
const TARGET_DATE = new Date('2026-02-04'); // Fixed date as per requirements
const DATA_DIR = path.join(__dirname, '../../initial_data');
const BOOK_FILE = path.join(DATA_DIR, 'json', 'bookings.json');

interface Booking {
    id: string;
    prop_id: string;
    arrival_date: string;
    departure_date: string;
    nights: number;
    days_out?: number;
    [key: string]: any;
}

function normalizeBookings() {
    console.log("🚀 Normalizing bookings data (TypeScript)...");

    if (!fs.existsSync(BOOK_FILE)) {
        console.error(`❌ Bookings file not found at ${BOOK_FILE}`);
        return;
    }

    const bookings: Booking[] = JSON.parse(fs.readFileSync(BOOK_FILE, 'utf-8'));
    const normalizedBookings: Booking[] = [];
    const oneDayMs = 1000 * 60 * 60 * 24;

    for (const booking of bookings) {
        // Parse original arrival date
        // Assuming arrival_date is YYYY-MM-DD
        const originalArrival = new Date(booking.arrival_date);

        // Add 1 month to original arrival date as per requirements
        // "Parse arrival_date as Date; add exactly 1 month"
        const shiftedArrival = new Date(originalArrival.getFullYear(), originalArrival.getMonth() + 1, originalArrival.getDate());

        // Calculate days_out relative to TARGET_DATE
        // days_out = (shiftedArrival - target) / 1 day
        const diffMs = shiftedArrival.getTime() - TARGET_DATE.getTime();
        const daysOut = Math.floor(diffMs / oneDayMs);

        if (daysOut <= 0) {
            console.warn(`⚠️ Warning: Booking ${booking.id} has days_out <= 0 (${daysOut}). Original: ${booking.arrival_date}, Shifted: ${shiftedArrival.toISOString().split('T')[0]}`);
        }

        const normalizedBooking: Booking = {
            ...booking,
            arrival_date: "", // Clear absolute dates
            departure_date: "",
            days_out: daysOut
        };

        normalizedBookings.push(normalizedBooking);
    }

    fs.writeFileSync(BOOK_FILE, JSON.stringify(normalizedBookings, null, 4));
    console.log(`✓ Normalized ${normalizedBookings.length} bookings.`);
    console.log(`✓ Reference Date: ${TARGET_DATE.toISOString().split('T')[0]}`);
    console.log(`💾 Updated ${BOOK_FILE}`);
}

normalizeBookings();
