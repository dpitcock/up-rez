import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        await sql`
            UPDATE offers 
            SET status = 'expired' 
            WHERE id = ${id}
        `;

        return NextResponse.json({
            status: 'ok',
            message: 'Offer marked as expired'
        });
    } catch (e: any) {
        console.error('API Error /offers/[id]/expire:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
