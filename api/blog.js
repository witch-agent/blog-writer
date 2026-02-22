// Vercel API Route for Blog Writer
// Deploy to Vercel and set MINIMAX_API_KEY in Vercel Dashboard

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';

const categoryPrompts = {
    tech: 'Technology article',
    finance: 'Finance and investment article',
    crypto: 'Cryptocurrency and blockchain article',
    lifestyle: 'Lifestyle and personal development article',
    business: 'Business and entrepreneurship article',
    tutorial: 'How-to tutorial article'
};

const stylePrompts = {
    professional: 'Professional, authoritative tone',
    casual: 'Casual, friendly, conversational tone',
    storytelling: 'Storytelling, narrative-driven tone',
    academic: 'Academic, research-oriented tone',
    persuasive: 'Persuasive, argumentative tone'
};

const lengthWords = {
    short: 500,
    medium: 1000,
    long: 2000,
    comprehensive: 3000
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { title, category, keywords, description, style, length } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        if (!MINIMAX_API_KEY) {
            return res.status(500).json({ 
                error: 'API key not configured',
                message: 'Please set MINIMAX_API_KEY in Vercel environment variables'
            });
        }
        
        const categoryPrompt = categoryPrompts[category] || categoryPrompts.tech;
        const stylePrompt = stylePrompts[style] || stylePrompts.professional;
        const targetWords = lengthWords[length] || lengthWords.medium;
        
        const userPrompt = `Write a complete ${targetWords}-word ${categoryPrompt} about: ${title}

Keywords: ${keywords || 'none provided'}
Description: ${description || 'none provided'}
Tone: ${stylePrompt}

Requirements:
- Engaging headline
- Compelling introduction (hook the reader)
- Well-structured body with H2 and H3 headings
- Practical examples and actionable insights
- Strong conclusion with call-to-action
- Write in ${stylePrompt}

Title: ${title}
Target: ~${targetWords} words

Write the complete article now.`;

        const response = await fetch(`${MINIMAX_BASE_URL}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': MINIMAX_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.5',
                max_tokens: 4096,
                system: 'You are a professional blog writer. Write engaging, SEO-friendly articles that captivate readers.',
                messages: [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: 'API failed', details: errorData });
        }
        
        const data = await response.json();
        
        let result = '';
        for (const block of data.content) {
            if (block.type === 'text') result += block.text;
        }
        
        return res.status(200).json({ result });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
