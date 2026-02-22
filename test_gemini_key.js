import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testKey() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error(".env.local not found");
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
        
        if (!match) {
            console.error("VITE_GEMINI_API_KEY not found in .env.local");
            return;
        }

        const apiKey = match[1].trim();
        console.log(`Testing API Key: ${apiKey.substring(0, 5)}...`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Hello, are you working?";
        console.log("Testing model: gemini-2.0-flash");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Success! Response:", text);

    } catch (error) {
        console.error("Error testing API key:", error.message);
        if (error.message.includes("API key not valid")) {
            console.error("The API key is invalid.");
        }
    }
}

testKey();
