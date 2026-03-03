const fetch = require('node-fetch');

async function verify() {
    console.log('Testing /api/ai-assistant with mock profile data...');
    try {
        const res = await fetch('http://localhost:3001/api/ai-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'Analyze this profile',
                profileData: {
                    fullName: 'John Doe',
                    headline: 'Software Engineer',
                    summary: 'Experienced developer',
                    experience: ['Google - 5 years'],
                    skills: ['React', 'Node.js'],
                    education: ['MIT']
                }
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('❌ Request failed:', data);
            return;
        }

        const response = data.response;
        console.log('✅ Response received');

        const requiredFields = [
            'overallScore', 'summary', 'experience', 'skills', 'education',
            'engagement', 'completenessChecklist', 'keywords', 'missingKeywords',
            'industry', 'industryAverages', 'percentile', 'recentActivity'
        ];

        let missing = [];
        requiredFields.forEach(f => {
            if (response[f] === undefined) missing.push(f);
        });

        if (missing.length > 0) {
            console.error('❌ Missing fields:', missing.join(', '));
        } else {
            console.log('✅ All required fields present');
            console.log('Sample Data:', JSON.stringify(response, null, 2).slice(0, 500) + '...');
        }
    } catch (err) {
        console.error('❌ Error during verification:', err.message);
    }
}

verify();
