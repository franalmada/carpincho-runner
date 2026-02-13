 
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

 
const sprites = {
    carpincho: new Image(),
    yacare: new Image(),
    tronco: new Image(),
    mosquito: new Image(),
 
};

 
sprites.carpincho.src = 'assets/carpincho.png';
sprites.yacare.src = 'assets/yacare.png';
sprites.tronco.src = 'assets/tronco.png';
sprites.mosquito.src = 'assets/mosquito.png';
 



 
const screens = {
    login: document.getElementById('login-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

 
let gameRunning = false;
let score = 0;
let gameSpeed = 5;
let frameCount = 0;  
let obstacles = [];  
let animationId;     
let currentSessionId = null;  
const API_URL = 'http://127.0.0.1:5000/api'; 
let cloudX = 0;
let nextSpawnDistance = 0;  


 
const carpincho = {
    x: 50,
    y: 0,  
    width: 40,
    height: 40,
    dy: 0,           
    jumpPower: -12,  
    gravity: 0.6,    
    grounded: false,
    
    draw: function() {
 
        if (sprites.carpincho.complete && sprites.carpincho.naturalHeight !== 0) {
            ctx.drawImage(sprites.carpincho, this.x, this.y, this.width, this.height);
        } else {
 
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    
    update: function() {
 
        this.dy += this.gravity;
        this.y += this.dy;

 
        if (this.y + this.height > canvas.height - 20) {  
            this.y = canvas.height - 20 - this.height;
            this.dy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    },
    
    jump: function() {
        if (this.grounded) {
            this.dy = this.jumpPower;
            this.grounded = false;
        }
    }
};

 
class Obstacle {
    constructor(type) {
        this.type = type;
        this.markedForDeletion = false;
        this.passed = false;  
        
 
        if (type === 'yacare') {
            this.width = 60;
            this.height = 30;
            this.color = '#2ecc71';  
            this.y = canvas.height - 20 - this.height;  
        } else if (type === 'tronco') {
            this.width = 30;
            this.height = 50;
            this.color = '#5d4037';  
            this.y = canvas.height - 20 - this.height;  
        } else if (type === 'mosquito') {
            this.width = 50;
            this.height = 50;
            this.color = '#000';  
            this.y = canvas.height - 100;  
        }
        
        this.x = canvas.width;  
    }

    draw() {
        let img = null;

 
        if (this.type === 'yacare') img = sprites.yacare;
        else if (this.type === 'tronco') img = sprites.tronco;
        else if (this.type === 'mosquito') img = sprites.mosquito;

        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
 
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        this.x -= gameSpeed;  
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }
}

 

function initGame() {
 
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 450;  

    score = 0;
    gameSpeed = 5;
    frameCount = 0;
    obstacles = [];
    gameRunning = true;
    
 
    carpincho.y = canvas.height - 100;
    carpincho.dy = 0;

    animate();
}

function spawnObstacle() {
 
    let lastObstacle = obstacles[obstacles.length - 1];
    
 
    if (!lastObstacle || (canvas.width - lastObstacle.x > nextSpawnDistance)) {
        
 
        const types = ['yacare', 'yacare', 'tronco', 'mosquito'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push(new Obstacle(randomType));

 
 
 
 
        let minGap = (gameSpeed * 50) + 150; 
        let maxGap = minGap + 200;  

 
        nextSpawnDistance = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
    }
}

function checkCollision(player, obstacle) {
    return (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
    );
}

function animate() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);  

 

ctx.fillStyle = '#ffeeb0';  
    
    ctx.fillStyle = '#8B5A2B';
ctx.fillRect(0, canvas.height - 25, canvas.width, 30);

 
ctx.fillStyle = '#5D3A1A';
for(let i=0; i<canvas.width; i+=40) {
    let x = (i - frameCount * gameSpeed) % canvas.width;
    if (x < 0) x += canvas.width;
    
 
    ctx.fillRect(x, canvas.height - 18, 4, 3);
    ctx.fillRect(x + 15, canvas.height - 22, 3, 2);
    ctx.fillRect(x + 30, canvas.height - 15, 5, 2);
}

 
ctx.fillStyle = '#C17A4B';
ctx.fillRect(0, canvas.height - 21, canvas.width, 1);

 
    carpincho.update();
    carpincho.draw();

 
    spawnObstacle();
    obstacles.forEach(obs => {
        obs.update();
        obs.draw();
        
 
        if (checkCollision(carpincho, obs)) {
            gameOver();
        }

 
 
        if (!obs.passed && obs.x + obs.width < carpincho.x) {
            score++;            
            obs.passed = true;  
            
 
        }
    });
    
 
    obstacles = obstacles.filter(obs => !obs.markedForDeletion);

 
    frameCount++;
    if (frameCount % 600 === 0) gameSpeed += 0.5;   
    console.log("Velocidad aumentada a: " + gameSpeed);

 
    document.getElementById('score').innerText = score.toString().padStart(5, '0');

    animationId = requestAnimationFrame(animate);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    screens.game.classList.add('hidden');
    screens.gameOver.classList.remove('hidden');
    document.getElementById('final-score').innerText = score;

 
    if (currentSessionId) {
        fetch(`${API_URL}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                session_id: currentSessionId, 
                score: score 
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Resultado guardado:", data);
            
            if (!data.valid) {
                alert("🚫 SISTEMA ANTI-TRAMPAS DETECTADO 🚫\nTu puntaje no coincide con el tiempo jugado.");
            }
            
 
 
            loadRanking(); 
        })
        .catch(err => {
            console.error("Error guardando score:", err);
            loadRanking();  
        });
    } else {
        loadRanking();  
    }
}
 

 
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const pin = document.getElementById('pin').value;
    const loading = document.getElementById('loading');
    
    if(nickname && pin.length === 4) {
 
        loading.classList.remove('hidden');
        
        try {
            const response = await fetch(`${API_URL}/start-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, pin })
            });
            
            const data = await response.json();
            
            if (data.session_id) {
                currentSessionId = data.session_id;  
                screens.login.classList.add('hidden');
                screens.game.classList.remove('hidden');
                loading.classList.add('hidden');
                initGame();
            } else {
                alert('Error al iniciar: ' + (data.error || 'Desconocido'));
                loading.classList.add('hidden');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor');
            loading.classList.add('hidden');
        }
    }
});

 
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        carpincho.jump();
    }
});

window.addEventListener('touchstart', (e) => {
    carpincho.jump(); 
 
    if(e.target === canvas) e.preventDefault();
}, {passive: false});

document.getElementById('game-canvas').addEventListener('click', () => {
    carpincho.jump();
});

 
document.getElementById('btn-restart').addEventListener('click', () => {
    screens.gameOver.classList.add('hidden');
    screens.game.classList.remove('hidden');
    initGame();
});

 
document.getElementById('btn-ranking').addEventListener('click', () => {
    alert("¡Aquí cargaremos la tabla de Neon SQL pronto!");
});

async function loadRanking() {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '<tr><td colspan="3">Cargando ranking...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const data = await response.json();

        tbody.innerHTML = '';  

        data.forEach(player => {
            const row = document.createElement('tr');
            
 
            const currentNick = document.getElementById('nickname').value;
            if (player.nickname === currentNick) {
                row.classList.add('current-user');
            }

            row.innerHTML = `
                <td>${player.posicion}</td>
                <td>${player.nickname}</td>
                <td>${player.puntaje}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3">Error al cargar ranking</td></tr>';
        console.error("Error cargando ranking:", error);
    }
}