// admin_panel.js
document.addEventListener('DOMContentLoaded', () => {
    // ACHTUNG: Ersetze DIESE URL durch die URL deines gehosteten Node.js-Backends
    const API_URL = 'https://deine-node-app.onrender.com';
    let username = localStorage.getItem('adminUsername');
    let password = localStorage.getItem('adminPassword');

    const loginForm = document.getElementById('login-form');
    const dashboard = document.getElementById('dashboard');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessage = document.getElementById('error-message');
    const logTableBody = document.getElementById('log-table-body');

    // Statistik-Anzeigen
    const pageViewsCount = document.getElementById('page-views-count');
    const buttonClicksCount = document.getElementById('button-clicks-count');
    const adminLoginsCount = document.getElementById('admin-logins-count');
    const dataAddedCount = document.getElementById('data-added-count');
    const dataDeletedCount = document.getElementById('data-deleted-count');

    // Chart-Element
    const deviceChartCtx = document.getElementById('device-chart').getContext('2d');
    let deviceChart;

    // --- Login/Logout Logik ---
    const checkLogin = () => {
        if (username && password) {
            fetchAnalytics();
        } else {
            loginForm.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    };

    loginBtn.addEventListener('click', async () => {
        const user = usernameInput.value;
        const pass = passwordInput.value;

        if (!user || !pass) {
            errorMessage.textContent = 'Bitte Benutzername und Passwort eingeben.';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await response.json();

            if (data.success) {
                username = user;
                password = pass;
                localStorage.setItem('adminUsername', username);
                localStorage.setItem('adminPassword', password);
                errorMessage.textContent = '';
                fetchAnalytics();
            } else {
                errorMessage.textContent = data.message;
            }
        } catch (error) {
            errorMessage.textContent = 'Verbindung zum Server fehlgeschlagen.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminPassword');
        username = null;
        password = null;
        checkLogin();
        location.reload(); // Seite neu laden für sauberen Zustand
    });

    // --- Datenabruf und Anzeige ---
    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/data?username=${username}&password=${password}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            const data = await response.json();
            if (data.success) {
                renderDashboard(data.analytics);
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Analytics:', error);
            alert(`Fehler: ${error.message}. Bitte neu anmelden.`);
            logoutBtn.click();
        }
    };

    const renderDashboard = (analytics) => {
        loginForm.classList.add('hidden');
        dashboard.classList.remove('hidden');
        logTableBody.innerHTML = '';

        let pageViews = 0;
        let buttonClicks = 0;
        let adminLogins = 0;
        let dataAdded = 0;
        let dataDeleted = 0;
        let deviceCounts = { desktop: 0, mobile: 0, other: 0 };

        analytics.forEach(log => {
            const row = document.createElement('tr');
            const formattedDate = new Date(log.timestamp).toLocaleString('de-DE');
            const detailsText = JSON.stringify(log.details, null, 2).replace(/"/g, '').replace(/,/g, ',<br>').replace(/{/g, '').replace(/}/g, '').replace(/<br>/g, '<br>&nbsp;&nbsp;');

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${log.event}</td>
                <td><pre>${detailsText}</pre></td>
            `;
            logTableBody.appendChild(row);

            // Zähle Statistiken
            switch (log.event) {
                case 'page_view':
                    pageViews++;
                    if (log.details.device === 'Mobile') {
                        deviceCounts.mobile++;
                    } else if (log.details.device === 'Desktop') {
                        deviceCounts.desktop++;
                    } else {
                        deviceCounts.other++;
                    }
                    break;
                case 'button_click':
                    buttonClicks++;
                    break;
                case 'admin_login_success':
                    adminLogins++;
                    break;
                case 'data_added':
                    dataAdded++;
                    break;
                case 'data_deleted':
                    dataDeleted++;
                    break;
            }
        });

        pageViewsCount.textContent = pageViews;
        buttonClicksCount.textContent = buttonClicks;
        adminLoginsCount.textContent = adminLogins;
        dataAddedCount.textContent = dataAdded;
        dataDeletedCount.textContent = dataDeleted;

        // Erstelle oder aktualisiere das Chart
        if (deviceChart) {
            deviceChart.destroy();
        }
        deviceChart = new Chart(deviceChartCtx, {
            type: 'pie',
            data: {
                labels: ['Desktop', 'Mobile', 'Andere'],
                datasets: [{
                    label: 'Gerätetypen',
                    data: [deviceCounts.desktop, deviceCounts.mobile, deviceCounts.other],
                    backgroundColor: ['#007bff', '#28a745', '#ffc107'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Gerätenutzung',
                        font: { size: 18 }
                    }
                }
            }
        });
    };

    checkLogin();
});