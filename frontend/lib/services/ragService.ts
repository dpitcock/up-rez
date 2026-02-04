import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function answerQueryWithLLM(
    question: string,
    propertyContext: string,
    guestContext: any,
    history: any[] = []
): Promise<string> {
    const guestName = (guestContext.guest_name || 'Valued Guest').split(' ')[0];

    // Pricing delta info
    const origAdr = guestContext.orig_adr || 0;
    const upgradeAdr = guestContext.discussed_pricing?.offer_adr || 0;
    const delta = Math.max(0, upgradeAdr - origAdr);

    const prompt = `You are a luxury concierge. You are speaking with ${guestName}.
    
    GUEST CONTEXT:
    - Current Booking: ${guestContext.arrival_date} to ${guestContext.departure_date}
    - Upgrade Option: ${propertyContext}
    - INCREMENTAL COST: It is ONLY €${delta.toFixed(2)} extra per night.
    
    YOUR MISSION:
    1. Sell the value of the upgrade.
    2. Focus on the low incremental cost (€${delta.toFixed(2)}/night).
    3. Be concise (2-3 sentences).
    
    HISTORY:
    ${history.map(m => `${m.role === 'user' ? 'Guest' : 'You'}: ${m.content}`).slice(-5).join('\n')}
    
    GUEST QUESTION: ${question}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
        });

        return response.choices[0].message.content?.trim() || "I'm sorry, I couldn't process that.";
    } catch (e) {
        console.error('LLM Error:', e);
        return "I'm having trouble connecting to my knowledge base right now.";
    }
}
