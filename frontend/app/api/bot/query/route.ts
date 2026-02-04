import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answerQueryWithLLM } from '@/lib/services/ragService';

export async function POST(req: NextRequest) {
    try {
        const { offer_id, prop_id, question, history } = await req.json();

        const property = await db.getProperty(prop_id);
        const offer = await db.getOffer(offer_id);
        const booking = offer ? await db.getBooking(offer.booking_id) : null;

        if (!property || !offer) {
            return NextResponse.json({ error: 'Context not found' }, { status: 404 });
        }

        // Build simple context string
        const propertyContext = `Property: ${property.name}, Location: ${property.location}, Beds: ${property.beds}, Amenities: ${property.amenities}`;

        const answer = await answerQueryWithLLM(
            question,
            propertyContext,
            {
                ...offer,
                guest_name: booking?.guest_name,
                orig_adr: booking?.base_nightly_rate
            },
            history
        );

        return NextResponse.json({
            offer_id,
            prop_id,
            answer
        });
    } catch (e: any) {
        console.error('API Error /bot/query:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
