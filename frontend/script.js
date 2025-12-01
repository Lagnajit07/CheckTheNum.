let gameId = "";
let playerName = "";
let steps = 0;
let socket = null;

// Render backend URL (no trailing slash)
const BASE_URL = "https://checkthenum-vgju.onrender.com";

// ---------------------- FIREWORKS -----------------------
function launchFireworks() {
    for (let i = 0; i < 20; i++) {
        const fw = document.createElement("div");
        fw.className = "firework";
        fw.style.left = Math.random() * window.innerWidth + "px";
        fw.style.top = Math.random() * window.innerHeight + "px";
        document.body.appendChild(fw);
        setTimeout(() => fw.remove(), 1000);
    }
}

// ---------------------- CREATE GAME ---------------------
async function createGame() {
    playerName = document.getElementById("playerName").value.trim();
    if (!playerName) return alert("Enter your name!");

    const number = prompt("Enter a 4-digit number:");
    if (!number || number.length !== 4 || isNaN(number)) return alert("Invalid number!");

    try {
        const res = await fetch(`${BASE_URL}/create_game`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ host_name: playerName, number })
        });

        const data = await res.json();
        if (!data.game_id) return alert(data.error || "Room creation failed!");

        gameId = data.game_id;
        document.getElementById("gameIdDisplay").innerText = gameId;

        connectWebSocket(gameId);

        document.getElementById("setup").style.display = "none";
        document.getElementById("game").style.display = "block";
    } catch (err) {
        console.error(err);
        alert("Failed to connect to backend!");
    }
}

// ---------------------- JOIN GAME -----------------------
async function joinGame() {
    playerName = document.getElementById("playerName").value.trim();
    gameId = document.getElementById("joinGameId").value.trim();

    if (!playerName || !gameId) return alert("Fill name & game ID");

    try {
        const res = await fetch(`${BASE_URL}/join_game`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ game_id: gameId, player_name: playerName })
        });

        const data = await res.json();
        if (data.error) return alert(data.error);

        document.getElementById("gameIdDisplay").innerText = gameId;

        connectWebSocket(gameId);

        document.getElementById("setup").style.display = "none";
        document.getElementById("game").style.display = "block";
    } catch (err) {
        console.error(err);
        alert("Failed to connect to backend!");
    }
}

// ---------------------- SUBMIT GUESS ---------------------
async function submitGuess() {
    const guess = document.getElementById("guessInput").value.trim();

    if (guess.length !== 4 || isNaN(guess)) return alert("Enter a valid 4-digit number!");

    try {
        const res = await fetch(`${BASE_URL}/guess`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ game_id: gameId, player_name: playerName, guess })
        });

        const data = await res.json();
        if (data.error) return alert(data.error);

        addGuessToTable(playerName, guess, data.correct_digits, data.correct_positions);

        if (data.completed) {
            steps = data.steps;
            showWinner();
        }

        document.getElementById("guessInput").value = "";
    } catch (err) {
        console.error(err);
        alert("Failed to submit guess!");
    }
}

// ---------------------- UPDATE GUESS TABLE ---------------------
function addGuessToTable(player, guess, digits, positions) {
    const tbody = document.querySelector("#guessTable tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${player}</td>
        <td>${guess}</td>
        <td>${digits}</td>
        <td>${positions}</td>
    `;

    tbody.appendChild(row);
}

// ---------------------- WINNER SCREEN ---------------------
function showWinner() {
    const win = document.getElementById("winner");
    win.innerHTML = `
        <h1>🎉 YOU WON! 🎉</h1>
        <h2>Steps Taken: <b>${steps}</b></h2>
    `;
    win.style.display = "block";

    setInterval(launchFireworks, 300);
}

// ---------------------- WEBSOCKET CHAT ---------------------
function connectWebSocket(gameId) {
    try {
        // socket = new WebSocket(`wss://checkthenum-vgju.onrender.com/ws/${gameId}`);
        socket = new WebSocket(`https://checkthenum-vgju.onrender.com/${gameId}`);
        
        socket.onopen = () => console.log("WebSocket Connected ✔");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "chat") updateChat(data.player, data.message);
        };

        socket.onerror = (err) => console.error("WebSocket error", err);

        socket.onclose = () => console.log("WebSocket closed ❌");
    } catch (err) {
        console.error("Failed to connect WebSocket", err);
    }
}

function sendChat() {
    const msg = document.getElementById("chatInput").value.trim();
    if (!msg || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: "chat", player: playerName, message: msg }));
    document.getElementById("chatInput").value = "";
}

function updateChat(player, message) {
    const box = document.getElementById("chatBox");
    const p = document.createElement("p");
    p.innerHTML = `<b>${player}:</b> ${message}`;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
}
