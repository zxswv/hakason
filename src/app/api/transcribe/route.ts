import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'AIzaSyBmrS_daMdl-j17s9dG8UlCiUrjaFNZEnM';

export async function POST(request: NextRequest) {
try {
const { audio } = await request.json();

// Google Cloud Speech-to-Text API エンドポイント
const response = await fetch(
'https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}',
{
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
config: {
encoding: 'WEBM_OPUS',
sampleRateHertz: 48000,
languageCode: 'ja-JP',
enableAutomaticPunctuation: true,
},
audio: {
content: audio,
},
}),
}
);
const data = await response.json();
if (!response.ok) {
console.error('API Error:', data);
return NextResponse.json(
{ error: data.error?.message || 'API request failed' },
{ status: response.status }
);
}
return NextResponse.json(data);
} catch (error: any) {
console.error('Server error:', error);
return NextResponse.json(
{ error: error.message || 'Internal server error' },
{ status: 500 }
);
}
}