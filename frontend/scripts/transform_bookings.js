const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'initial_data/bookings.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const bookings = JSON.parse(rawData);

const updatedBookings = bookings.map(b => {
    const daysOut = Math.floor(Math.random() * (60 - 7 + 1)) + 7;
    return {
        ...b,
        arrival_date: null,
        departure_date: null,
        days_out: daysOut
    };
});

fs.writeFileSync(filePath, JSON.stringify(updatedBookings, null, 4));
console.log(`Updated ${bookings.length} bookings with dynamic days_out.`);
