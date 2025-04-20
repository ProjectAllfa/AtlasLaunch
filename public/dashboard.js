// Check if the agent is logged in (check for token)
const token = localStorage.getItem('agentToken');
if (!token) {
    window.location.href = '/agentlogin'; // Redirect to login if no token
}

let agentData = null; // Store agent data globally

// Function to fetch agent data from the server
async function fetchAgentData() {
    try {
        const response = await fetch('/agents/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (response.status === 200) {
            agentData = result; // Store agent data globally
            document.getElementById('header-balance').querySelector('.balance-text').textContent = `$${result.balance.toFixed(2)}`;
        } else {
            alert(result.message || 'Failed to load agent data.');
        }
    } catch (error) {
        console.error('Error fetching agent data:', error);
        alert('An error occurred while fetching agent data.');
    }
}

// Function to update the DOM with agent information
function updateAgentInfo() {
    if (agentData) {
        // Update the spans with field names and dynamic values
        document.getElementById('agent-username').textContent = `Username: ${agentData.username}`;
        document.getElementById('agent-phone').textContent = `Phone: ${agentData.phoneNumber}`;
        document.getElementById('agent-balance').textContent = `Balance: $${agentData.balance.toFixed(2)}`;
        document.getElementById('agent-wallet').textContent = `Wallet: ${agentData.walletAddress}`; // ✅ New line
    }
}

// Profile Button and Dropdown Menu
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const closeDropdownBtn = document.querySelector('.close-btn');

// Toggle profile dropdown when profile button is clicked
profileBtn.addEventListener('click', (event) => {
    if (agentData) {
        updateAgentInfo(); // Update the dropdown with the agent's information when opened
        profileDropdown.classList.toggle('show'); // Toggle the class for visibility
    } else {
        alert('Agent data is not loaded yet.');
    }
});

// Close profile dropdown when close button is clicked
closeDropdownBtn.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
});

// Optionally, close profile dropdown when clicking outside of it
window.addEventListener('click', (event) => {
    if (!profileDropdown.contains(event.target) && event.target !== profileBtn) {
        profileDropdown.classList.remove('show');
    }
});


// Handle user creation form
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get input values
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const subscriptionDuration = document.getElementById('subscription-duration').value.toString(); // Force to string
    const accountName = document.getElementById('account-name').value;
    const accountPhone = document.getElementById('account-phone').value;

    // Debugging line: check subscription duration before submitting
    console.log('Subscription Duration before submit:', subscriptionDuration);
    console.log('Request data:', { username, password, subscriptionDuration, accountName, accountPhone });

    if (!subscriptionDuration) {
        alert("Please select a subscription duration.");
        return;
    }

    const requestData = {
        username,
        password,
        subscriptionDuration, // Backend will calculate the exact expiry date
        accountName,
        accountPhone
    };

    try {
        const response = await fetch('/agents/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
    
        const result = await response.json();
        if (response.status === 201) {
            showUserCreatedToast(); // Show the success toast instead of alert
            document.getElementById('create-user-form').reset(); // Reset form
            fetchAgentData(); // Refresh balance
            fetchUserList(); // Refresh list
        } else {
            alert(result.message || 'Failed to create user.');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('An error occurred while creating the user.');
    }       
});


// Handle subscription duration selection
document.querySelectorAll('.duration-btn').forEach(button => {
    button.addEventListener('click', function () {
        console.log("Button clicked:", this.dataset.duration); // ✅ Debugging
        // Remove 'selected' class from all buttons
        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('selected'));

        // Add 'selected' class to the clicked button
        this.classList.add('selected');

        // Store the selected duration in the hidden input field
        document.getElementById('subscription-duration').value = this.dataset.duration;

        // Debugging line: verify the value is set in hidden input
        console.log('Hidden input value set to:', document.getElementById('subscription-duration').value);
    });
});

// Show "User Created Successfully!" toast
function showUserCreatedToast() {
    const toast = document.createElement('div');
    toast.textContent = 'User Created Successfully!';
    toast.className = 'user-created-toast'; // Use the user-created-toast class for this message
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 10);
}



// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('agentToken'); // Remove token
    window.location.href = '/agentlogin'; // Redirect to login
});

// Load agent data on page load
fetchAgentData();


// Function to calculate the remaining days until subscription expiry
function calculateRemainingDays(expiryDate) {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert ms to days

    return daysRemaining > 0 ? `${daysRemaining} days` : "Ended"; // Show "Ended" if expired
}

// Function to filter user list by username and status
function filterUserList(status = 'all') {
    const searchQuery = document.getElementById('user-search').value.toLowerCase(); // Get the search query
    const rows = document.querySelectorAll('#user-table-body tr'); // Get all rows in the table

    // Loop through all rows and hide those that don't match the search or status filter
    rows.forEach(row => {
        const username = row.querySelector('td[data-label="Username"]').textContent.toLowerCase();
        const userStatus = row.querySelector('td[data-label="Status"]').textContent.toLowerCase();

        // Check if the row matches the search query
        const matchesSearch = username.includes(searchQuery);

        // Check if the row matches the selected status filter
        const matchesStatus = (status === 'all') ||
            (status === 'active' && userStatus === 'active') || 
            (status === 'inactive' && userStatus === 'inactive');

        // Show or hide the row based on search and status filter
        if (matchesSearch && matchesStatus) {
            row.style.display = ''; // Show row if it matches both search and status
        } else {
            row.style.display = 'none'; // Hide row if it doesn't match
        }
    });
}

// Function to handle status filter buttons
function filterUsers(status) {
    // Clear previous filter (if any)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => button.classList.remove('active'));

    // Mark the clicked filter as active
    const selectedButton = document.getElementById(`filter-${status}`);
    selectedButton.classList.add('active');

    // Re-filter the user list based on the new filter
    filterUserList(status);
}

// Function to fetch and display user list
async function fetchUserList() {
    try {
        const response = await fetch('/agents/users', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (response.status === 200) {
            const users = result.users;
            const userListContainer = document.getElementById('user-table-body');

            // Clear any previous list
            userListContainer.innerHTML = '';

            // Loop through the users and create rows for each user
            users.forEach(user => {
                const remainingDays = calculateRemainingDays(user.subscriptionExpiry);

                const row = document.createElement('tr');

                // Determine status class
                const statusClass = user.activeStatus.toLowerCase() === "active" ? "status-active" : "status-inactive";

                row.innerHTML = `
                <td data-label="Username">${user.username}</td>
                <td data-label="Subscription Expiry">${new Date(user.subscriptionExpiry).toLocaleDateString()}</td>
                <td data-label="Remaining">${remainingDays}</td>
                <td data-label="Status" class="${statusClass}">${user.activeStatus}</td>
                <td data-label="Account Name">${user.accountName || '-'}</td>
                <td data-label="Account Phone">${user.accountPhone || '-'}</td>
                <td data-label="Creation Date">${new Date(user.accountCreationDate).toLocaleDateString()}</td>
                <td data-label="Action">
                    <button class="renew-action" data-username="${user.username}">Renew</button>
                </td>
            `;

                userListContainer.appendChild(row);
            });

            // Attach event listeners to the renew buttons
            document.querySelectorAll('.renew-action').forEach(button => {
                button.addEventListener('click', function () {
                    const username = this.dataset.username;
                    openRenewModal(username); // Open the renewal modal
                });
            });

        } else {
            alert(result.message || 'Failed to load user list.');
        }
    } catch (error) {
        console.error('Error fetching user list:', error);
        alert('An error occurred while fetching the user list.');
    }
}

// Load user list on page load
fetchUserList();


/////////////////////////////////////////////////////////////////////////////// Subscription Renewal Modal ///////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("renew-modal");
    const renewDurationField = document.getElementById("renew-duration");
    let selectedDuration = null;

    // Ensure modal is hidden on page load
    modal.style.display = "none";

    console.log("DOM fully loaded, script initialized.");

    // Function to open modal
    function openRenewModal(username) {
        console.log(`Opening modal for username: ${username}`);
        document.getElementById("renew-username").value = username; // Hidden input for form logic
        document.getElementById("renew-username-text").textContent = username; // Display-only text
        modal.style.display = "flex";
    
        // Ensure buttons are correctly set up when the modal is opened
        attachRenewButtonListeners();
    }    
    window.openRenewModal = openRenewModal; // Expose function globally

    // Function to close modal
    function closeRenewModal() {
        console.log("Closing modal, resetting selection.");
        modal.style.display = "none";
        selectedDuration = null; // Reset selection
        renewDurationField.value = "";
        document.querySelectorAll(".renew-btn").forEach(btn => btn.classList.remove("selected"));
    }

    // Handle clicking "Renew" button (inside user list)
    document.getElementById("user-table-body").addEventListener("click", function (e) {
        if (e.target.classList.contains("renew-action")) {
            const username = e.target.dataset.username;
            console.log(`Renew button clicked for user: ${username}`);
            openRenewModal(username);
        }
    });

    // Close modal when clicking close button (inside modal-content)
    document.querySelector("#renew-modal .modal-content").addEventListener("click", function (e) {
        if (e.target.classList.contains("close-btn")) {
            console.log("Close button clicked.");
            closeRenewModal();
        }
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", function (e) {
        if (e.target === modal) {
            console.log("Clicked outside modal, closing.");
            closeRenewModal();
        }
    });

    // Attach listeners to subscription buttons
    function attachRenewButtonListeners() {
        console.log("Attaching event listeners to subscription buttons...");
        const renewButtons = document.querySelectorAll(".renew-btn");

        if (renewButtons.length === 0) {
            console.warn("No subscription buttons found. Check if the modal is being populated correctly.");
        }

        renewButtons.forEach(btn => {
            console.log(`Found button: ${btn.innerText} | Data-duration: ${btn.getAttribute("data-duration")}`);
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                selectedDuration = this.getAttribute("data-duration");
                console.log(`Selected duration: ${selectedDuration}`);

                if (!selectedDuration) {
                    console.error("No duration found on clicked button!");
                }

                renewDurationField.value = selectedDuration;
                document.querySelectorAll(".renew-btn").forEach(b => b.classList.remove("selected"));
                this.classList.add("selected");
            });
        });
    }

    // Ensure buttons work when modal opens
    attachRenewButtonListeners();

    // Handle subscription renewal submission
    document.getElementById("renew-subscription-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const username = document.getElementById("renew-username").value;
        let duration = renewDurationField.value;

        // Convert duration to a number if needed
        duration = parseInt(duration, 10);

        console.log(`Submitting renewal for ${username}, duration: ${duration} (type: ${typeof duration})`);

        if (!duration || isNaN(duration)) {
            alert("Please select a valid duration.");
            console.error("Subscription renewal failed: No valid duration selected.");
            return;
        }

        try {
            const response = await fetch("/agents/renew-subscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Ensure token is defined
                },
                // **Fix**: Send subscriptionDuration instead of duration
                body: JSON.stringify({ username, subscriptionDuration: duration })
            });

            const result = await response.json();
            if (response.ok) {
                showSubscriptionRenewedToast(username); // Show subscription renewal toast
                console.log(`Subscription successfully renewed for ${username}`);
                closeRenewModal();
                fetchAgentData(); // Refresh balance
                fetchUserList(); // Refresh list
            } else {
                showCopyToast(result.message || "Failed to renew subscription.", true); // Show error toast
                console.error("Failed to renew subscription:", result.message);
            }            
        } catch (error) {
            console.error("Error renewing subscription:", error);
            alert("An error occurred.");
        }
    });
});


// Show a simple toast message for subscription renewal
function showSubscriptionRenewedToast(username) {
    const message = `Subscription Renewed for ${username}`;
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'subscription-renew-toast';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 10);
}



/////////////////////////////////////////////////////////////////////////////// Deposit Section  ///////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => { 
    // Only bind event listeners after the DOM has fully loaded

    // Function to populate the deposit section with the wallet address
    function populateDepositSection() {
        if (agentData && agentData.walletAddress) {
            document.getElementById('deposit-address').value = agentData.walletAddress;
        }
    }

    // Deposit Button click event listener
    document.getElementById('deposit-btn').addEventListener('click', () => {
        // Hide other sections if they exist
        const dashboardSection = document.getElementById('dashboard-section');
        const usersSection = document.getElementById('users-section');
        const createUserSection = document.getElementById('create-user-section');
        const depositSection = document.getElementById('deposit-section');

        if (dashboardSection) dashboardSection.style.display = 'none';
        if (usersSection) usersSection.style.display = 'none';
        if (createUserSection) createUserSection.style.display = 'none';
        
        // Show the deposit section
        if (depositSection) depositSection.style.display = 'block';

        // Populate the wallet address
        populateDepositSection();
    });

    // Copy address functionality
    document.getElementById('copy-address-btn').addEventListener('click', () => {
        const addressInput = document.getElementById('deposit-address');
        
        if (addressInput && addressInput.value) {
            // Select and copy the address
            addressInput.select();
            addressInput.setSelectionRange(0, 99999); // For mobile devices
            navigator.clipboard.writeText(addressInput.value).then(() => {
                // Deselect the text after copying
                window.getSelection().removeAllRanges();
    
                showCopyToast("Address copied!");
            }).catch(err => {
                console.error('Failed to copy address:', err);
                showCopyToast("Failed to copy", true);
            });
        }
    });
    

    // Show a simple toast message
    function showCopyToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `copy-toast ${isError ? 'error' : ''}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 10);
    }
});


///////////////////////////////////////////////////////////////////// Deposits History Code ////////////////////////////////////////////////////////////////////////////////////////////////

// Toggle visibility of both deposit section and deposit history section
document.getElementById('deposit-btn').addEventListener('click', function () {
    // Get the sections
    const depositSection = document.getElementById('deposit-section');
    const depositHistorySection = document.getElementById('deposit-history-section');
    const createUserSection = document.querySelector('.create-user');
    const userListSection = document.querySelector('.user-list');

    // Hide the other sections
    createUserSection.style.display = 'none';
    userListSection.style.display = 'none';

    // Show the deposit sections
    depositSection.style.display = 'block';
    depositHistorySection.style.display = 'block';

    // Fetch deposit history
    fetchDepositHistory();
});

// Fetch and display deposit history
async function fetchDepositHistory() {
    const loadingIndicator = document.getElementById('deposit-loading');
    const errorMessage = document.getElementById('deposit-error-message');
    const depositTableBody = document.querySelector('#deposit-history-table tbody');

    // Show loading and clear previous error/deposits
    loadingIndicator.style.display = 'block';
    errorMessage.textContent = '';
    depositTableBody.innerHTML = '';

    try {
        const token = localStorage.getItem('agentToken');
        const response = await fetch('/agents/deposits', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error fetching deposit history');
        }

        const data = await response.json();

        if (Array.isArray(data.deposits)) {
            const deposits = data.deposits;

            const formatWallet = (wallet) => {
                return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 6)}`;
            };

            const formatTimestamp = (timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleString('en-US', {
                    month: 'numeric', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: 'numeric',
                    hour12: true
                });
            };

            if (deposits.length === 0) {
                depositTableBody.innerHTML = '<tr><td colspan="7">No deposit history available.</td></tr>';
            } else {
                deposits.forEach(deposit => {
                    const depositRow = document.createElement('tr');
                    const statusClass = 'status-completed';

                    depositRow.innerHTML = `
                        <td class="deposit-timestamp">${formatTimestamp(deposit.timestamp)}</td>
                        <td class="deposit-from">${formatWallet(deposit.fromWallet)}</td>
                        <td class="deposit-coin">USDT</td>
                        <td class="deposit-amount">${deposit.amount}</td>
                        <td class="deposit-to">${formatWallet(deposit.toWallet)}</td>
                        <td class="deposit-txHash">
                            <a href="https://bscscan.com/tx/${deposit.txHash}" target="_blank">${deposit.txHash.substring(0, 10)}...</a>
                        </td>
                        <td class="deposit-status ${statusClass}">Completed</td>
                    `;
                    depositTableBody.appendChild(depositRow);
                });
            }
        } else {
            throw new Error('Deposit data is not in the expected format');
        }
    } catch (error) {
        console.error(error);
        errorMessage.textContent = 'Failed to load deposit history. Please try again later.';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

document.getElementById('refresh-deposit-history').addEventListener('click', function () {
    const icon = this.querySelector('i');
    icon.classList.add('spinning'); // Add spin class

    // Remove spin class after animation ends (600ms)
    setTimeout(() => icon.classList.remove('spinning'), 600);

    fetchDepositHistory(); // Fetch history
});

///////////////////////////////////////////////////////////////////////////////////// Home Button ///////////////////////////////////////////////////////////////////////////////

document.getElementById('home-btn').addEventListener('click', function () {
    const depositSection = document.getElementById('deposit-section');
    const depositHistorySection = document.getElementById('deposit-history-section');
    const createUserSection = document.querySelector('.create-user');
    const userListSection = document.querySelector('.user-list');

    depositSection.style.display = 'none';
    depositHistorySection.style.display = 'none';
    createUserSection.style.display = 'block';
    userListSection.style.display = 'block';
});
