const emailInput = document.getElementById("email");
const generateBtn = document.getElementById("generate");
const newEmailBtn = document.getElementById("newEmail");
const copyBtn = document.getElementById("copy");
const refreshBtn = document.getElementById("refresh");
const status = document.getElementById("status");
const inbox = document.getElementById("inbox");
const mailCount = document.getElementById("mailCount");
const notification = document.getElementById("notification");

let token = "";
let password = "";

function generatePassword() {
    return Math.random().toString(36).slice(-12) + "A1!";
}
let currentEmail = "";
let domains = [];

async function loadDomains() {

    const response = await fetch("https://api.mail.tm/domains");
    const data = await response.json();

    domains = data["hydra:member"];

}

function randomName(length = 10) {

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {

        result += chars[Math.floor(Math.random() * chars.length)];

    }

    return result;

}

generateBtn.onclick = async () => {

    try {password = generatePassword();

        status.innerHTML = "Creating email...";

        if (domains.length === 0) {

            await loadDomains();

        }

        let domain = domains.find(d => d.domain.endsWith(".com"));

        if (!domain) {

            domain = domains[0];

        }

        currentEmail = randomName() + "@" + domain.domain;

        const account = await fetch("https://api.mail.tm/accounts", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                address: currentEmail,

                password: password

            })

        });

        if (!account.ok) {

            throw new Error();

        }

        const login = await fetch("https://api.mail.tm/token", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                address: currentEmail,

                password: password

            })

        });

        const loginData = await login.json();

        token = loginData.token;

        emailInput.value = currentEmail;

        status.innerHTML = "✅ Email created successfully";

    }

    catch {

        status.innerHTML = "❌ Error creating email";

    }

};
copyBtn.onclick = async () => {

    if (!currentEmail) {
        status.innerHTML = "Generate an email first";
        return;
    }

    await navigator.clipboard.writeText(currentEmail);

    status.innerHTML = "📋 Email copied";

};

refreshBtn.onclick = loadInbox;

async function loadInbox() {

    if (!token) {

        status.innerHTML = "Generate an email first";

        return;

    }

    status.innerHTML = "Loading inbox...";

    const response = await fetch("https://api.mail.tm/messages", {

        headers: {

            Authorization: "Bearer " + token

        }

    });

    const data = await response.json();
  mailCount.innerHTML = data["hydra:member"].length;

    inbox.innerHTML = "";

    if (data["hydra:member"].length === 0) {

        inbox.innerHTML = `
<div class="mail-card">
<div class="mail-subject">
📭 No messages
</div>
</div>
`;

        status.innerHTML = "Inbox updated";

        return;

    }

    data["hydra:member"].forEach(mail => {

        inbox.innerHTML += `

<div class="mail-card" onclick="openMail('${mail.id}')">

<div class="mail-from">
📧 ${mail.from.address}
</div>

<div class="mail-subject">
${mail.subject || "No Subject"}
</div>

<div class="mail-date">
${new Date(mail.createdAt).toLocaleString()}
</div>

</div>

`;

    });

    status.innerHTML = "Inbox updated";

}
async function openMail(id) {

    status.innerHTML = "Opening message...";

    const response = await fetch(
        "https://api.mail.tm/messages/" + id,
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const mail = await response.json();

    inbox.innerHTML = `
<div class="mail-card">

<div class="mail-from">
📧 ${mail.from.address}
</div>

<div class="mail-subject">
${mail.subject || "No Subject"}
</div>

<hr style="margin:15px 0;">

<div id="messageContent" style="
padding:15px;
background:white;
color:black;
border-radius:10px;
overflow:auto;
max-height:500px;
">

${mail.html ? mail.html : `<pre>${mail.text || "No content"}</pre>`}

</div>

<button id="backInbox" style="margin-top:20px;">
⬅ Back to Inbox
</button>

</div>
`;

    document.getElementById("backInbox").onclick = loadInbox;

    status.innerHTML = "Message opened";

}

let lastMessageCount = 0;

setInterval(async () => {

    if (!token) return;

    const response = await fetch(
        "https://api.mail.tm/messages",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const data = await response.json();

    const count = data["hydra:member"].length;

    if (count !== lastMessageCount) {

        lastMessageCount = count;

        loadInbox();

        if (count > 0) {

            status.innerHTML = "📩 New message received";

notification.style.display = "block";

setTimeout(() => {

    notification.style.display = "none";

},3000);

        }

    }

}, 5000);
newEmailBtn.onclick = async () => {

    token = "";
    currentEmail = "";

    emailInput.value = "";

    inbox.innerHTML = "No messages yet.";

    status.innerHTML = "";

    await generateBtn.onclick();

};