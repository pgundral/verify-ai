const OpenAI = require("openai");

const openai = new OpenAI({ 
    apiKey: API_KEY
});

// Insert text from post here
const redditPostText = ""

(async () => {
    try {
        const completion = await fetch("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                // System role defines behavior + context (prompt)
                { role: "system", content: `You are a user reading an online forum site about a certain disease. 
                You want to be sure that the posts you are reading are not written in a misleading way or by relying heavily 
                on anecdotes to make conclusions. Read this post, and find the central claim and the pieces of evidence used to support it. 
                Classify each of those pieces of evidence as one of the following: anecdotal, unlikely to be supported by evidence, 
                misleading, untrue, likely to be supported by evidence, not misleading, true.` },
                {
                // User role defines first message in the chat (post to respond to)
                    role: "user",
                    content: redditPostText,
                },
            ],
            store: true,
        });
        // completion.choices[0].message provides the object for the response message
        // .content accesses the actual text output
        console.log(completion.choices[0].message.content);
    } catch (error) {
        console.error("Error fetching completion:", error);
    }
})();
