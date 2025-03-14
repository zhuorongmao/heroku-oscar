const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors()); // Allow cross-origin requests


const OSCAR_API_URL = "http://gpu2002.oscar.ccv.brown.edu:11434/api/generate"; 


// put together the prompt
app.post("/process", async (req, res) => {
    try {
        const { currentMessage, messageHistory, includeProspectus } = req.body;

        if (!currentMessage) {
            return res.status(400).json({ error: "No prompt provided" });
        }

        console.log("Received input from Qualtrics:", currentMessage);

        // Construct prompt with message history
        let prompt = [
            ...messageHistory,
            { role: 'user', content: currentMessage },
        ];

        // Append prospectus content if requested
        if (includeProspectus) {
            try {
                const prospectusContent = fs.readFileSync('./prospectus.txt', 'utf-8');
                prompt.push({ role: 'user', content: `Prospectus: ${prospectusContent}` });
            } catch (err) {
                console.error("Error reading prospectus file:", err);
            }
        }

        // Send request to Ollama on Oscar
        const ollamaResponse = await fetch(OSCAR_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama3.2", messages: prompt }),
        });

        const data = await ollamaResponse.json();

        console.log("Ollama response:", data);

        // Format response before sending it back
        const formattedReply = formatResponse(data.message.content);

        // Send response back to Qualtrics
        res.json({ reply: formattedReply });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// **Fix: Add a GET route to prevent "Cannot GET /" errors**
app.get('/', (req, res) => {
    res.send('Hello, World! The server is working!');
});

// **Fix: Ensure only one app.listen call**
const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Middleware server running on port ${PORT}`);
});
