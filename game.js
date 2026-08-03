const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
const scoreDisplay = document.getElementById("score");

const blackHole = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 80
};

let shapes = [];
let draggingShape = null;

// Create random shapes
function spawnShape() {
    const size = 40;
    shapes.push({
        x: Math.random() * (canvas.width - size),
        y: Math.random() * (canvas.height - size),
        size: size,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
}

setInterval(spawnShape, 1000); // spawn every second

canvas.addEventListener("mousedown", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    for (let s of shapes) {
        if (
            mx > s.x && mx < s.x + s.size &&
            my > s.y && my < s.y + s.size
        ) {
            draggingShape = s;
            break;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (draggingShape) {
        draggingShape.x = e.clientX - draggingShape.size / 2;
        draggingShape.y = e.clientY - draggingShape.size / 2;
    }
});

canvas.addEventListener("mouseup", () => {
    draggingShape = null;
});

function update() {
    // Check if shapes touch the black hole
    shapes = shapes.filter(s => {
        const dx = (s.x + s.size / 2) - blackHole.x;
        const dy = (s.y + s.size / 2) - blackHole.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < blackHole.radius) {
            score++;
            scoreDisplay.textContent = "Score: " + score;
            return false; // remove shape
        }
        return true;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw black hole
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();

    ctx.strokeStyle = "purple";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw shapes
    for (let s of shapes) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
