import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { answer: "OpenAI API Key not configured on server." },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { question, history, context } = body;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a grounding-first luxury concierge. Answer ONLY using the provided property data. If a feature isn't explicitly listed, DO NOT CONFIRM IT. Say 'I don't have that detail' and pivot. NEVER invent private pools or specific views. Be factual (max 2 sentences)."
                    },
                    ...history.slice(-3).map((m: any) => ({
                        role: m.role === 'bot' ? 'assistant' : 'user',
                        content: m.content
                    })),
                    {
                        role: "user",
                        content: `${context}\n\nGUEST QUESTION: ${question}`
                    }
                ],
                max_tokens: 150,
                temperature: 0.1
            })
        });

        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";

        return NextResponse.json({ answer });
    } catch (err) {
        console.error("API Route Chat Error:", err);
        return NextResponse.json(
            { answer: "I'm having trouble connecting to my brain right now." },
            { status: 500 }
        );
    }
}
