
// Send Notifications Logic (calls backend ADMIN ONLY)
async function sendNotification() {
    const message = document.getElementById('notification-message').value.trim();
    const recipient = document.getElementById('notification-recipient').value.trim();
    const duration = document.getElementById('notification-duration').value;
  
    if (!message) {
        alert("Message cannot be empty.");
        return;
    }
  
    try {
        const response = await fetch('/api/admin/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message, recipient, duration })
        });
  
        const data = await response.json();
        alert(data.message); // Show success message
        document.getElementById('notification-message').value = ""; // Clear input
  
    } catch (error) {
        console.error("Error sending notification:", error);
    }
  }
  

  async function createUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const subscriptionExpiry = document.getElementById("subscriptionExpiry").value;
    const accountName = document.getElementById("accountName").value;
    const accountPhone = document.getElementById("accountPhone").value;
    const agentName = document.getElementById("agentName").value;
    const agentPhone = document.getElementById("agentPhone").value;
    const type = document.getElementById("type").value; // ✅ Get selected type

    try {
        const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, subscriptionExpiry, accountName, accountPhone, agentName, agentPhone, type })
        });

        const data = await response.json();
        document.getElementById("message").textContent = data.message;
        document.getElementById("message").style.color = response.ok ? "green" : "red";

    } catch (error) {
        console.error("Create User Error:", error);
        document.getElementById("message").textContent = "❌ Server error. Try again.";
    }
}

let allUsers = []; // Global array to store users

// Function to fetch users 
async function fetchUsers() {
    try {
        const response = await fetch('/api/admin/users', { credentials: 'include' });
        allUsers = await response.json(); // Store users globally
        displayUsers(allUsers); // Display fetched users
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Function to Display users in list
function displayUsers(users) {
    const userList = document.getElementById("user-list");
    userList.innerHTML = ""; // Clear existing rows

    // ✅ Update user counts
    document.getElementById("total-users").textContent = users.length;
    document.getElementById("active-users").textContent = users.filter(user => user.active).length;
    document.getElementById("inactive-users").textContent = users.filter(user => !user.active).length;

    users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span id="username-${user._id}">${user.username}</span></td>
            <td>
                <span id="expiry-${user._id}">${new Date(user.subscriptionExpiry).toLocaleDateString()}</span>
                <button onclick="toggleExpiryEdit('${user._id}')">Edit Expiry Date</button>
            </td>
            <td class="${user.active ? 'active-true' : 'active-false'}">${user.active ? "Active" : "Inactive"}</td>
            <td><span id="name-${user._id}">${user.accountName || "N/A"}</span></td>
            <td><span id="phone-${user._id}">${user.accountPhone || "N/A"}</span></td>
            <td><span id="agent-${user._id}">${user.agentName || "N/A"}</span></td>
            <td><span id="agentPhone-${user._id}">${user.agentPhone || "N/A"}</span></td>
            <td><span id="type-${user._id}">${user.type}</span></td>
            <td>${new Date(user.accountCreationDate).toLocaleDateString()}</td>
            <td>
                <button id="edit-btn-${user._id}" onclick="toggleEditMode('${user._id}')">Edit</button>
                <button onclick="deleteUser('${user._id}')">Delete</button>
            </td>
        `;
        userList.appendChild(row);
    });

    document.getElementById("userTable").style.display = "table"; // Show table
}


// Filter for search by agent name
function filterUsersByAgent() {
    const searchValue = document.getElementById("agentSearch").value.toLowerCase().trim();

    if (searchValue === "") {
        displayUsers(allUsers); // ✅ Restore full list when search is cleared
        return;
    }

    const filteredUsers = allUsers.filter(user =>
        user.agentName?.toLowerCase().includes(searchValue)
    );

    displayUsers(filteredUsers); // Show filtered results
}


async function updateUser(userId) {
const accountName = document.querySelector(`#name-${userId} input`).value;
const accountPhone = document.querySelector(`#phone-${userId} input`).value;
const agentName = document.querySelector(`#agent-${userId} input`).value;
const agentPhone = document.querySelector(`#agentPhone-${userId} input`).value;
const type = document.querySelector(`#type-${userId} select`).value;

try {
const response = await fetch('/api/admin/edit-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, accountName, accountPhone, agentName, agentPhone, type }) // ✅ Removed subscriptionExpiry
});

const data = await response.json();
alert(data.message);
fetchUsers(); // Refresh user list

} catch (error) {
console.error("Error updating user:", error);
}
}


async function deleteUser(userId) {
if (!confirm("Are you sure you want to delete this user?")) return;

try {
const response = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId })
});

const data = await response.json();
alert(data.message);
fetchUsers(); // Refresh user list
} catch (error) {
console.error("Error deleting user:", error);
}
}


function toggleEditMode(userId) {
const isEditing = document.getElementById(`edit-btn-${userId}`).textContent === "Save";

if (isEditing) {
updateUser(userId);
} else {
 // ✅ DO NOT TOUCH expiry date
document.getElementById(`name-${userId}`).innerHTML = `<input type="text" value="${document.getElementById(`name-${userId}`).textContent}">`;
document.getElementById(`phone-${userId}`).innerHTML = `<input type="text" value="${document.getElementById(`phone-${userId}`).textContent}">`;
document.getElementById(`agent-${userId}`).innerHTML = `<input type="text" value="${document.getElementById(`agent-${userId}`).textContent}">`;
document.getElementById(`agentPhone-${userId}`).innerHTML = `<input type="text" value="${document.getElementById(`agentPhone-${userId}`).textContent}">`;

// ✅ Add a dropdown to select type (trial/paid)
document.getElementById(`type-${userId}`).innerHTML = `
    <select>
        <option value="trial" ${document.getElementById(`type-${userId}`).textContent === "trial" ? "selected" : ""}>Trial</option>
        <option value="paid" ${document.getElementById(`type-${userId}`).textContent === "paid" ? "selected" : ""}>Paid</option>
    </select>
`;

document.getElementById(`edit-btn-${userId}`).textContent = "Save";
}
}



function toggleUserList() {
    const table = document.getElementById("userTable");
    if (table.style.display === "none") {
        fetchUsers();
    } else {
        table.style.display = "none";
    }
}


async function updateExpiryDate(userId) {
const newExpiryDate = document.querySelector(`#expiry-${userId} input`).value;

try {
const response = await fetch('/api/admin/update-expiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, subscriptionExpiry: newExpiryDate })
});

const data = await response.json();
alert(data.message);
fetchUsers(); // Refresh user list after update

} catch (error) {
console.error("Error updating expiry date:", error);
}
}



function toggleExpiryEdit(userId) {
const expiryElement = document.getElementById(`expiry-${userId}`);
const isEditing = expiryElement.querySelector("input") !== null;

if (isEditing) {
updateExpiryDate(userId);
} else {
const currentExpiry = expiryElement.textContent.trim();
const currentExpiryDate = new Date(currentExpiry);

// ✅ Fix timezone issue by manually formatting YYYY-MM-DD without UTC shift
const formattedDate = new Date(currentExpiryDate.getTime() - currentExpiryDate.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];

expiryElement.innerHTML = `<input type="date" value="${formattedDate}"> 
                           <button onclick="updateExpiryDate('${userId}')">Save</button>`;
}
}

////////////////////////////////////////////////////////////////////////////  AGENT LIST IN ADMIN PANEL ///////////////////////////////////////////////////////////////////////////

// Fetch and display agents
async function fetchAgents() {
    try {
        const response = await fetch('/api/admin/agents', { credentials: 'include' });
        const agents = await response.json();
        
        const agentList = document.getElementById("agent-list");
        agentList.innerHTML = ""; // Clear existing rows

        agents.forEach(agent => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><span id="agent-username-${agent._id}">${agent.username}</span></td>
                <td><span id="agent-phone-${agent._id}">${agent.phoneNumber}</span></td>
                <td><span id="agent-balance-${agent._id}">${agent.balance.toFixed(2)}</span> USDT</td>
                <td>${new Date(agent.createdAt).toLocaleDateString()}</td>
                <td>${agent.totalUsers}</td> <!-- New field added -->
                <td>${agent.walletAddress}</td> <!-- Display wallet address -->
                <td>
                    <span id="private-key-${agent._id}" class="hidden-key">••••••••••••</span>
                    <button onclick="togglePrivateKey('${agent._id}')">Show</button>
                    <button id="copy-btn-${agent._id}" style="display: none;" onclick="copyToClipboard('${agent._id}', '${agent.privateKey}')">Copy</button>
                </td>
                <td>
                    <button id="edit-agent-btn-${agent._id}" onclick="toggleAgentEdit('${agent._id}')">Edit</button>
                </td>
            `;
            agentList.appendChild(row);
        });
        
        document.getElementById("agentTable").style.display = "table"; // Show table

    } catch (error) {
        console.error("Error fetching agents:", error);
    }
}

// Toggle visibility of private key
async function togglePrivateKey(agentId) {
    const keySpan = document.getElementById(`private-key-${agentId}`);
    const copyButton = document.getElementById(`copy-btn-${agentId}`); // Get the copy button

    if (keySpan.textContent === "••••••••••••") {
        try {
            // Fetch the decrypted private key from the server
            const response = await fetch(`/api/admin/decrypt-key/${agentId}`, { credentials: 'include' });
            
            if (response.ok) {
                const data = await response.json();
                keySpan.textContent = data.privateKey; // Show decrypted key
                copyButton.style.display = "inline-block"; // Show the copy button when the key is revealed
            } else {
                console.error('Error fetching decrypted private key:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching private key:', error);
        }
    } else {
        keySpan.textContent = "••••••••••••"; // Hide key
        copyButton.style.display = "none"; // Hide the copy button when the key is hidden
    }
}

// Copy private key to clipboard
function copyToClipboard(agentId) {
    const keySpan = document.getElementById(`private-key-${agentId}`);
    const privateKey = keySpan.textContent; // Get the decrypted private key from the DOM

    navigator.clipboard.writeText(privateKey).then(() => {
        alert("Private key copied to clipboard!");
    }).catch((error) => {
        console.error("Error copying text to clipboard:", error);
    });
}

// Toggle agent edit mode
function toggleAgentEdit(agentId) {
    const editButton = document.getElementById(`edit-agent-btn-${agentId}`);
    const isEditing = editButton.textContent === "Save";

    if (isEditing) {
        updateAgent(agentId);
    } else {
        // Get current values
        const phoneValue = document.getElementById(`agent-phone-${agentId}`).textContent;
        const balanceValue = parseFloat(document.getElementById(`agent-balance-${agentId}`).textContent);

        // Replace with input fields
        document.getElementById(`agent-phone-${agentId}`).innerHTML = `<input type="text" value="${phoneValue}" id="input-phone-${agentId}">`;
        document.getElementById(`agent-balance-${agentId}`).innerHTML = `<input type="number" value="${balanceValue}" step="0.01" id="input-balance-${agentId}">`;
        
        editButton.textContent = "Save";
    }
}

// Update agent details
async function updateAgent(agentId) {
    const phoneNumber = document.getElementById(`input-phone-${agentId}`).value;
    const balance = parseFloat(document.getElementById(`input-balance-${agentId}`).value);

    try {
        const response = await fetch(`/api/admin/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phoneNumber, balance })  // FIXED phone field
        });

        const data = await response.json();
        alert(data.message);

        fetchAgents(); // Refresh agent list after update
    } catch (error) {
        console.error("Error updating agent:", error);
    }
}

// Toggle agent list visibility
function toggleAgentList() {
    const table = document.getElementById("agentTable");
    if (table.style.display === "none") {
        fetchAgents();
    } else {
        table.style.display = "none";
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Log out function
async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
}

