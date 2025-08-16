// admin_panel.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ [Start] Seite geladen. Führe DOMContentLoaded-Skript aus.");

    // URL deines gehosteten Node.js-Backends
    const API_URL = 'https://monadminserver.onrender.com';
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

    console.log(`ℹ️ [Info] Aktueller Anmeldestatus: username=${username ? "vorhanden" : "fehlt"}, password=${password ? "vorhanden" : "fehlt"}`);

    // --- Login/Logout Logik ---
    const checkLogin = () => {
        console.log("➡️ [Funktion] checkLogin() wird aufgerufen.");
        if (username && password) {
            console.log("✅ [Status] Anmeldedaten im localStorage gefunden. Verstecke Login-Formular und zeige Dashboard.");
            loginForm.classList.add('hidden');
            dashboard.classList.remove('hidden');
            console.log("➡️ [Nächster Schritt] Starte Datenabruf mit fetchAnalytics().");
            fetchAnalytics();
        } else {
            console.log("❌ [Status] Keine Anmeldedaten gefunden. Zeige Login-Formular an.");
            loginForm.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    };

    loginBtn.addEventListener('click', async () => {
        console.log("➡️ [Event] 'Anmelden'-Button wurde geklickt. Starte Anmeldevorgang.");
        const user = usernameInput.value;
        const pass = passwordInput.value;

        if (!user || !pass) {
            console.log("❌ [Validierung] Benutzername oder Passwort fehlt. Zeige Fehlermeldung.");
            errorMessage.textContent = 'Bitte Benutzername und Passwort eingeben.';
            return;
        }

        try {
            console.log(`➡️ [API] Sende POST-Anfrage an ${API_URL}/admin/login mit Benutzername: ${user}`);
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await response.json();
            console.log("✅ [API-Antwort] Login-Antwort empfangen:", data);

            if (data.success) {
                console.log("✅ [Erfolg] Server-Antwort war erfolgreich. Speichere Anmeldedaten im localStorage.");
                username = user;
                password = pass;
                localStorage.setItem('adminUsername', username);
                localStorage.setItem('adminPassword', password);
                errorMessage.textContent = '';
                checkLogin();
            } else {
                console.log(`❌ [Fehler] Login nicht erfolgreich. Server-Nachricht: "${data.message}"`);
                errorMessage.textContent = data.message;
            }
        } catch (error) {
            console.error("🔥 [Kritischer Fehler] Verbindung zur API fehlgeschlagen.", error);
            errorMessage.textContent = 'Verbindung zum Server fehlgeschlagen.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        console.log("➡️ [Event] 'Abmelden'-Button wurde geklickt. Lösche Anmeldedaten.");
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminPassword');
        username = null;
        password = null;
        checkLogin();
        console.log("✅ [Status] Seite wird für einen sauberen Zustand neu geladen.");
        location.reload();
    });

    // --- Datenabruf und Anzeige ---
    const fetchAnalytics = async () => {
        console.log("➡️ [API] Starte Datenabruf für Dashboard. Sende GET-Anfrage an /admin/data.");
        try {
            const response = await fetch(`${API_URL}/admin/data?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);

            if (!response.ok) {
                console.log(`❌ [API-Fehler] HTTP-Status ${response.status} erhalten.`);
                if (response.status === 401) {
                    console.log("⚠️ [Warnung] 401: Nicht autorisiert. Anmeldedaten sind ungültig oder abgelaufen.");
                    alert('Sitzung abgelaufen oder ungültige Anmeldedaten. Bitte neu anmelden.');
                    logoutBtn.click();
                }
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            const data = await response.json();

            if (data.success) {
                console.log("✅ [Erfolg] Daten erfolgreich empfangen. Starte Dashboard-Rendering.");
                console.log("📦 [Daten] Empfangene Daten:", data.analytics);
                renderDashboard(data.analytics);
            } else {
                console.log("❌ [Fehler] Server hat 'success: false' zurückgegeben. Rendering wird abgebrochen.");
            }
        } catch (error) {
            console.error('🔥 [Kritischer Fehler] beim Abrufen der Analytics-Daten:', error);
            alert(`Fehler beim Laden der Daten: ${error.message}.`);
        }
    };

    const renderDashboard = (analytics) => {
        console.log("➡️ [Rendering] Funktion renderDashboard() wird ausgeführt.");
        loginForm.classList.add('hidden');
        dashboard.classList.remove('hidden');
        logTableBody.innerHTML = '';

        // ... (Rest der Rendering-Logik bleibt unverändert) ...
        let pageViews = 0;
        let buttonClicks = 0;
        let adminLogins = 0;
        let dataAdded = 0;
        let dataDeleted = 0;
        let deviceCounts = { desktop: 0, mobile: 0, other: 0 };

        console.log("➡️ [Datenverarbeitung] Beginne mit der Verarbeitung der Analysedaten...");
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
        console.log("✅ [Datenverarbeitung] Statistische Daten gezählt:", { pageViews, buttonClicks, adminLogins, dataAdded, dataDeleted, deviceCounts });

        pageViewsCount.textContent = pageViews;
        buttonClicksCount.textContent = buttonClicks;
        adminLoginsCount.textContent = adminLogins;
        dataAddedCount.textContent = dataAdded;
        dataDeletedCount.textContent = dataDeleted;

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
        console.log("✅ [Rendering] Dashboard-Rendern abgeschlossen. Alle Daten angezeigt.");
    };

    checkLogin();
});