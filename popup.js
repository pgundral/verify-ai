console.log('This is a popup!');

// Define variables to store the post title, content, and manual input
let post_title = '';
let post_content = [];
let manual_input = '';
let has_manual_input = false;
let response = '';

// Get the current tab URL, and scrape the site for the post title and content
// Store the post title and content to send to the API
async function start() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    console.log(url);
    await scrapeSite(url);
    const textFieldDiv = document.getElementById('text-field');
    const my_string = "\"" + post_title + '-' + post_content + "... \""
    textFieldDiv.textContent = truncateString(my_string, 195);
}

function getKey() {
    fetch("api-key.txt")
        .then(response => response.text())
    .then(data => {
        api_key = data;
    });
}

// Scraping the Reddit page for the post title and content
// In the future, this function can be expanded to scrape other sites
async function scrapeSite(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        post_title = doc.querySelector('h1').textContent; 
        doc.querySelectorAll('div.text-neutral-content p').forEach((elem) => {
            post_content.push(elem.textContent);
        });
    } catch (error) {
        console.error('Error scraping site:', error);
    }
}

// Function to truncate a string to a certain number of characters
function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '... \"';
}

// Function to create or toggle the text entry box
function createTextEntryBox() {
    const container = document.getElementById('text-entry-container');
    const textEntryButton = document.getElementById('text-entry-button');
    const existingInput = container.querySelector('input');
    if (existingInput) {
        // If the input exists, remove it
        container.removeChild(existingInput);
        textEntryButton.textContent = 'Manual Text Entry';
        const textFieldDiv = document.getElementById('text-field');
        const my_string = "\"" + post_title + '-' + post_content + "... \""
        has_manual_input = false;
        textFieldDiv.textContent = truncateString(my_string, 195);
    } else {
        // If the input does not exist, create it
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter your text here';
        container.appendChild(input);
        textEntryButton.textContent = 'Automatic Text Entry';
        input.addEventListener('input', () => {
            manual_input = input.value;
            has_manual_input = true;
            const textFieldDiv = document.getElementById('text-field');
            textFieldDiv.textContent = truncateString("\"" + manual_input + "\"", 195);
        });
    }
}


//Function that feeds the post content to the GPT-4o model and generates a response
async function generateResponse() {
    console.log('Generating response...');
    const verifyButton = document.getElementById('verify-button');
    verifyButton.textContent = 'Verifying...';
    verifyButton.disabled = true; // Disable the button to prevent multiple clicks
    try {
        let userContent = has_manual_input ? manual_input : post_content[0];
        const completion = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": 'Bearer {API KEY}'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    // System role defines behavior + context (prompt)
                    { role: "system", content: `You are a user reading an online forum site about a certain medical issue. 
                    You want to be sure that the posts you are reading are not written in a misleading way or by relying heavily 
                    on anecdotes to make conclusions. Read this post, and find the central claim and the pieces of evidence used to support it. 
                    Classify important medical claims in the post as one of the following: personal experience, 
                    anecdotal, unlikely to be supported by evidence, misleading, untrue, likely to be supported by evidence, not misleading, verifiable. 
                    Back up classifications with reasoning, but treat posts and sensitive experiences with kindness. Keep your response concise` },
                    {
                    // User role defines first message in the chat (post to respond to)
                        role: "user",
                        content: userContent
                    },
                ]
            })
        });
        const data = await completion.json();
        // data.choices[0].message provides the object for the response message
        // .content accesses the actual text output
        response = data.choices[0].message.content;
        console.log(response);
    } catch (error) {
        console.error("Error fetching completion:", error);
    }
}

// Function to display the response in the popup window
function displayResponse() {
    const head2Div = document.querySelector('.head-2');
    const textFieldDiv = document.getElementById('text-field');
    const verifyButton = document.getElementById('verify-button');
    const manualTextButton = document.getElementById('text-entry-button');
    const textEntryContainer = document.getElementById('text-entry-container');
    const aContainer = document.querySelector('.a-container');
    
    // Hide the elements
    verifyButton.style.display = 'none';
    head2Div.style.display = 'none';
    textFieldDiv.style.display = 'none';
    verifyButton.style.display = 'none';
    manualTextButton.style.display = 'none';
    textEntryContainer.style.display = 'none';

    // Create a new div to show the response
    const responseDiv = document.createElement('div');
    responseDiv.classList.add('response');
    responseDiv.innerHTML = response.replace(/\n/g, '<br>') // Replace newlines with line breaks
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Replace bold markdown with HTML bold tags
    document.body.insertBefore(responseDiv, aContainer);

    // Create a back button with the same style
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.className = 'backbutton';
    document.body.insertBefore(backButton, aContainer);

    // Add event listener to reset the UI when back is clicked
    backButton.addEventListener('click', () => {
        head2Div.style.display = 'block';
        textFieldDiv.style.display = 'block';
        verifyButton.style.display = 'block';
        manualTextButton.style.display = 'block';
        textEntryContainer.style.display = 'block';
        verifyButton.style.display = 'block';
        verifyButton.textContent = 'Verify';
        verifyButton.disabled = false;
        responseDiv.remove();
        backButton.remove();
    });
}

// Call the start function when the popup loads
document.addEventListener('DOMContentLoaded', start);
//Generate and display response when verify button is clicked
const verifyButton = document.getElementById('verify-button');
verifyButton.addEventListener('click', async () => {
    await generateResponse();
    displayResponse();
});

const manualInputButton = document.getElementById('text-entry-button');
manualInputButton.addEventListener('click', createTextEntryBox);

