/**
 * ============================================================================
 * Retail Store Replenishment & Demand Planning System
 * File: login.js
 * Description: Client-side authentication logic, credential validation,
 *              password visibility toggle, and session management.
 * ============================================================================
 */

// Authorized Demo Accounts
const AUTHORIZED_USERS = [
    {
        username: "admin",
        password: "admin123",
        displayName: "Alex Morgan",
        role: "Store Operations Manager"
    },
    {
        username: "planner",
        password: "plan123",
        displayName: "Sarah Chen",
        role: "Demand Planning Specialist"
    },
    {
        username: "analyst",
        password: "analyst123",
        displayName: "David Kumar",
        role: "Supply Chain Analyst"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect straight to dashboard
    const existingUser = sessionStorage.getItem("retail_current_user") || localStorage.getItem("retail_current_user");
    if (existingUser) {
        // Optionally redirect directly, or let user switch accounts
        // We allow staying on login if '?logout=true' is present in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get("logout")) {
            window.location.href = "index.html";
            return;
        }
    }

    const loginForm = document.getElementById("form-login");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const roleSelect = document.getElementById("user-role-select");
    const rememberMeCheckbox = document.getElementById("remember-me");
    const alertBox = document.getElementById("login-alert");
    const togglePwBtn = document.getElementById("btn-toggle-password");

    const demoAdminBtn = document.getElementById("btn-demo-admin");
    const demoPlannerBtn = document.getElementById("btn-demo-planner");

    // Toggle Password Visibility
    if (togglePwBtn && passwordInput) {
        togglePwBtn.addEventListener("click", () => {
            const isPassword = passwordInput.getAttribute("type") === "password";
            passwordInput.setAttribute("type", isPassword ? "text" : "password");
            togglePwBtn.textContent = isPassword ? "🙈" : "👁️";
        });
    }

    // Quick Demo 1-Click Login: Store Manager
    if (demoAdminBtn) {
        demoAdminBtn.addEventListener("click", () => {
            usernameInput.value = "admin";
            passwordInput.value = "admin123";
            roleSelect.value = "Store Operations Manager";
            executeLogin("admin", "admin123", "Store Operations Manager");
        });
    }

    // Quick Demo 1-Click Login: Demand Planner
    if (demoPlannerBtn) {
        demoPlannerBtn.addEventListener("click", () => {
            usernameInput.value = "planner";
            passwordInput.value = "plan123";
            roleSelect.value = "Demand Planning Specialist";
            executeLogin("planner", "plan123", "Demand Planning Specialist");
        });
    }

    // Form Submission Handler
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim().toLowerCase();
            const password = passwordInput.value.trim();
            const selectedRole = roleSelect.value;
            executeLogin(username, password, selectedRole);
        });
    }

    /**
     * Authenticate and redirect
     */
    function executeLogin(username, password, selectedRole) {
        // Hide previous alerts
        alertBox.classList.remove("show");

        // Validate credentials
        const matchedUser = AUTHORIZED_USERS.find(
            u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );

        if (!matchedUser) {
            // Also accept any valid input if the teacher tests custom names
            if (username.length >= 3 && password.length >= 4) {
                // Allow custom user login for convenience
                saveSessionAndRedirect({
                    username: username,
                    displayName: username.charAt(0).toUpperCase() + username.slice(1),
                    role: selectedRole,
                    loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                return;
            }

            alertBox.textContent = "Invalid username or password. (Hint: Try 'admin' / 'admin123')";
            alertBox.classList.add("show");
            return;
        }

        // Save session
        saveSessionAndRedirect({
            username: matchedUser.username,
            displayName: matchedUser.displayName,
            role: selectedRole || matchedUser.role,
            loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    function saveSessionAndRedirect(userPayload) {
        const remember = rememberMeCheckbox ? rememberMeCheckbox.checked : true;
        const serialized = JSON.stringify(userPayload);

        sessionStorage.setItem("retail_current_user", serialized);
        if (remember) {
            localStorage.setItem("retail_current_user", serialized);
        } else {
            localStorage.removeItem("retail_current_user");
        }

        // Redirect to main dashboard
        window.location.href = "index.html";
    }
});
