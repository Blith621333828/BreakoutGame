const canvas = document.getElementById("breakoutCanvas");
const ctx = canvas.getContext("2d");

// Ustawienia gry
const paddleHeight = 15;
let paddleWidth = 150; // Domyślna szerokość palety
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 10;
let balls = []; // Tablica do przechowywania piłek
let initialBallSpeed = 5;
let ballSpeed = initialBallSpeed;

const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

let score = 0;
let lives = 3;
let level = 1;

let rightPressed = false;
let leftPressed = false;

// Power-upy
let powerUps = [];
const powerUpColors = ["#ff8c00", "#ff8c00", "#00ff00"];
const powerUpWidth = 50;
const powerUpHeight = 20;
const powerUpSpeed = 3;

// Specjalny power-up - czarna piłka
let specialBallActive = false;
const specialBallColor = "#000000";
const specialBallSpeed = 8;
const specialBallRadius = 15;
let specialBall = {};

// Elementy interfejsu użytkownika
const gameOverContainer = document.getElementById("gameOverContainer");
const gameOverText = document.getElementById("gameOverText");
const restartButton = document.getElementById("restartButton");

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

// Inicjalizacja gry
function initGame() {
    // Ustawienie początkowej prędkości piłki
    ballSpeed = initialBallSpeed;
    
    // Ustawienie palety na środku
    paddleX = (canvas.width - paddleWidth) / 2;
    
    // Tworzenie początkowej piłki
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: ballSpeed,
        dy: -ballSpeed,
        color: "#ffffff"
    }];
    
    // Resetowanie cegieł
    resetBricks();
}

// Resetowanie cegieł na planszy
function resetBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

// Rysowanie palety
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
}

// Rysowanie piłek
function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Rysowanie cegieł
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "#ff8000"; // Pomarańczowy kolor cegieł
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Rysowanie wyniku
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 8, 20);
}

// Rysowanie żyć
function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}

// Rysowanie poziomu
function drawLevel() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Level: " + level, canvas.width / 2 - 30, 20);
}

// Rysowanie power-upów
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.beginPath();
        ctx.rect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
        ctx.fillStyle = powerUpColors[powerUp.type];
        ctx.fill();
        ctx.closePath();
    });

    // Rysowanie specjalnej piłki (czarnej)
    if (specialBallActive) {
        ctx.beginPath();
        ctx.arc(specialBall.x, specialBall.y, specialBallRadius, 0, Math.PI * 2);
        ctx.fillStyle = specialBallColor;
        ctx.fill();
        ctx.closePath();
    }
}

// Przesuwanie power-upów
function movePowerUps() {
    powerUps.forEach(powerUp => {
        powerUp.y += powerUpSpeed;
    });

    // Usuwanie power-upów, które wyleciały poza ekran
    powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);
}

// Funkcja generująca losowy power-up
function generateRandomPowerUp(brickX, brickY) {
    const type = Math.floor(Math.random() * 3); // Losowy rodzaj power-upa
    const x = brickX + (brickWidth - powerUpWidth) / 2;
    const y = brickY + (brickHeight - powerUpHeight) / 2;

    return { x, y, type };
}

// Detekcja kolizji z power-upami
function detectPowerUpCollision() {
    powerUps.forEach((powerUp, index) => {
        if (paddleX < powerUp.x + powerUpWidth &&
            paddleX + paddleWidth > powerUp.x &&
            canvas.height - paddleHeight < powerUp.y + powerUpHeight &&
            canvas.height > powerUp.y) {
            applyPowerUpEffect(powerUp.type);
            powerUps.splice(index, 1);
        }
    });
}

// Aplikowanie efektu power-upa
function applyPowerUpEffect(type) {
    switch (type) {
        case 0: // Powiększenie palety
            paddleWidth += 50;
            setTimeout(() => {
                paddleWidth -= 50;
            }, 15000); // Efekt trwa przez 15 sekund (15000 ms)
            break;
        case 1: // Dodatkowe życie
            lives++;
            break;
        case 2: // Trzy dodatkowe piłki
            addMultiBalls();
            break;
        case 3: // Specjalna piłka (czarna)
            activateSpecialBall();
            break;
        default:
            break;
    }
}

// Aktywacja specjalnej piłki (czarnej)
function activateSpecialBall() {
    specialBallActive = true;
    specialBall = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        dx: specialBallSpeed,
        dy: -specialBallSpeed
    };

    setTimeout(() => {
        specialBallActive = false;
    }, 10000); // Specjalna piłka działa przez 10 sekund (10000 ms)
}

// Dodanie trzech dodatkowych piłek
function addMultiBalls() {
    for (let i = 0; i < 3; i++) {
        balls.push({
            x: canvas.width / 2,
            y: canvas.height - 30,
            dx: ballSpeed,
            dy: -ballSpeed,
            color: "#ff8000"
        });
    }
}

// Funkcja detekcji kolizji z cegłami
function collisionDetection() {
    bricks.forEach(column => {
        column.forEach(brick => {
            if (brick.status === 1) {
                balls.forEach(ball => {
                    if (ball.x > brick.x && ball.x < brick.x + brickWidth &&
                        ball.y > brick.y && ball.y < brick.y + brickHeight) {
                        ball.dy = -ball.dy;
                        brick.status = 0;
                        score++;
                        // Generowanie power-upa po trafieniu w cegłę
                        if (Math.random() < 0.2) { // 20% szansa na generację power-upa
                            powerUps.push(generateRandomPowerUp(brick.x, brick.y));
                        }
                        if (score === brickRowCount * brickColumnCount * level) {
                            level++;
                            resetGame();
                        }
                    }
                });
            }
        });
    });
}

// Funkcja resetująca grę po zniszczeniu wszystkich piłek
function resetGame() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: ballSpeed,
        dy: -ballSpeed,
        color: "#ffffff"
    }];
    paddleWidth = 150; // Zresetowanie szerokości palety
    paddleX = (canvas.width - paddleWidth) / 2;
}

// Funkcja rysująca całą grę
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    drawScore();
    drawLives();
    drawLevel();
    drawPowerUps();
    movePowerUps();
    detectPowerUpCollision();
    collisionDetection();
    movePaddle();
    moveBalls();

    if (lives === 0) {
        // Wyświetlenie napisu "Zginales" i przycisku restart
        gameOverContainer.style.display = "block";
        gameOverText.textContent = "Zginales";
    } else {
        requestAnimationFrame(draw);
    }
}

// Funkcja przemieszczająca paletę
function movePaddle() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }
}

// Funkcja przemieszczająca piłki
function moveBalls() {
    balls.forEach((ball, ballIndex) => {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Odbicie od ścian
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ballRadius) {
            // Zderzenie z paletą
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                ball.dy = -ball.dy;
            } else {
                // Piłka dotknęła dolnej krawędzi ekranu - piłka znika
                balls.splice(ballIndex, 1); // Usunięcie piłki z listy
                if (balls.length === 0) {
                    lives--; // Zmniejszenie liczby żyć
                    if (lives === 0) {
                        gameOver();
                    } else {
                        resetGame();
                    }
                }
            }
        }
    });

    // Ruch specjalnej piłki (czarnej)
    if (specialBallActive) {
        specialBall.x += specialBall.dx;
        specialBall.y += specialBall.dy;

        // Odbicie od ścian
        if (specialBall.x + specialBall.dx > canvas.width - specialBallRadius || specialBall.x + specialBall.dx < specialBallRadius) {
            specialBall.dx = -specialBall.dx;
        }
        if (specialBall.y + specialBall.dy < specialBallRadius) {
            specialBall.dy = -specialBall.dy;
        } else if (specialBall.y + specialBall.dy > canvas.height - specialBallRadius) {
            // Zderzenie z paletą
            if (specialBall.x > paddleX && specialBall.x < paddleX + paddleWidth) {
                specialBall.dy = -specialBall.dy;
            } else {
                specialBallActive = false; // Zatrzymanie specjalnej piłki po zderzeniu z dolną krawędzią ekranu
            }
        }

        // Detekcja kolizji z cegłami dla specjalnej piłki
        collisionDetectionForSpecialBall();
    }
}

// Funkcja detekcji kolizji z cegłami dla specjalnej piłki
function collisionDetectionForSpecialBall() {
    bricks.forEach(column => {
        column.forEach(brick => {
            if (brick.status === 1) {
                if (specialBall.x > brick.x && specialBall.x < brick.x + brickWidth &&
                    specialBall.y > brick.y && specialBall.y < brick.y + brickHeight) {
                    brick.status = 0;
                    score++;
                }
            }
        });
    });

    // Sprawdzenie, czy wszystkie cegły zostały zniszczone
    if (score === brickRowCount * brickColumnCount * level) {
        level++;
        resetGame();
    }
}

// Funkcja kończąca grę po utracie wszystkich żyć
function gameOver() {
    // Wyświetlenie kontenera "Zginales" i przycisku restart
    gameOverContainer.style.display = "block";
    gameOverText.textContent = "Zginales";
}

// Obsługa kliknięcia przycisku restart
restartButton.addEventListener("click", function () {
    // Resetowanie gry
    score = 0;
    lives = 3;
    level = 1;
    resetGame();
    resetBricks();
    gameOverContainer.style.display = "none";
    draw();
});

initGame();
draw();
