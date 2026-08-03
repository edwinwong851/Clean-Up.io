const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
const scoreDisplay = document.getElementById("score");

// ---------------------- UPGRADE VARIABLES ----------------------
let scoreMultiplier = 1;
let scoreMultiplierLevel = 0;
const scoreMultiplierMax = 5;

let autoCollector = false;
let autoCollectorLevel = 0;
const autoCollectorMax = 5;

// ---------------------- BLACK HOLE ----------------------
const blackHole = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 80
};

let shapes = [];
let draggingShape = null;

// ---------------------- SHAPE TYPES WITH RARITY ----------------------
const SHAPE_TYPES = [
    { type: "square", points: 1, chance: 0.50 },
    { type: "circle", points: 2, chance: 0.30 },
    { type: "triangle", points: 4, chance: 0.15 },
    { type: "diamond", points: 10, chance: 0.05 }
];

function rollShapeType() {
    let r = Math.random();
    let sum = 0;

    for (let s of SHAPE_TYPES) {
        sum += s.chance;
        if (r < sum) return s;
    }
    return SHAPE_TYPES[0];
}

// ---------------------- MUTATIONS ----------------------
const MUTATIONS = [
    { name: "none", chance: 0.85, bonus: 0, colorEffect: null },
    { name: "spark", chance: 0.10, bonus: 1, colorEffect: "white" },
    { name: "flare", chance: 0.04, bonus: 3, colorEffect: "yellow" },
    { name: "nova", chance: 0.01, bonus: 10, colorEffect: "cyan" },
    { name: "supernova", chance: 0.002, bonus: 25, colorEffect: "magenta" }
];

function rollMutation() {
    let r = Math.random();
    let sum = 0;

    for (let m of MUTATIONS) {
        sum += m.chance;
        if (r < sum) return m;
    }
    return MUTATIONS[0];
}

// ---------------------- SPAWN SHAPES ----------------------
function spawnShape() {
    const size = 40;
    const shapeType = rollShapeType();
    const mutation = rollMutation();

    shapes.push({
        x: Math.random() * (canvas.width - size),
        y: Math.random() * (canvas.height - size),
        size,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        type: shapeType.type,
        points: shapeType.points + mutation.bonus,
        mutation
    });

    if (mutation.name === "supernova") {
        announce("MYTHIC MUTATION!");
    }
}

// ⭐ Slower spawn interval (4 seconds)
setInterval(spawnShape, 4000);

// ---------------------- DRAW SHAPES ----------------------
function drawShape(s) {
    ctx.fillStyle = s.color;

    if (s.type === "square") {
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    if (s.type === "circle") {
        ctx.beginPath();
        ctx.arc(s.x + s.size/2, s.y + s.size/2, s.size/2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (s.type === "triangle") {
        ctx.beginPath();
        ctx.moveTo(s.x + s.size/2, s.y);
        ctx.lineTo(s.x, s.y + s.size);
        ctx.lineTo(s.x + s.size, s.y + s.size);
        ctx.closePath();
        ctx.fill();
    }

    if (s.type === "diamond") {
        ctx.beginPath();
        ctx.moveTo(s.x + s.size/2, s.y);
        ctx.lineTo(s.x, s.y + s.size/2);
        ctx.lineTo(s.x + s.size/2, s.y + s.size);
        ctx.lineTo(s.x + s.size, s.y + s.size/2);
        ctx.closePath();
        ctx.fill();
    }

    // Mutation glow
    if (s.mutation.name !== "none") {
        ctx.strokeStyle = s.mutation.colorEffect;
        ctx.lineWidth = 3;
        ctx.strokeRect(s.x - 2, s.y - 2, s.size + 4, s.size + 4);
    }
}

// ---------------------- INPUT ----------------------
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

// ---------------------- UPDATE ----------------------
function update() {
    shapes = shapes.filter(s => {

        // AUTO COLLECTOR (with level scaling)
        if (autoCollector) {
            const dx = blackHole.x - (s.x + s.size/2);
            const dy = blackHole.y - (s.y + s.size/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            const pullRadius = 150 + autoCollectorLevel * 40;
            const pullStrength = 0.01 + autoCollectorLevel * 0.005;

            if (dist < pullRadius) {
                s.x += dx * pullStrength;
                s.y += dy * pullStrength;
            }
        }

        // Black hole collision
        const dx = (s.x + s.size / 2) - blackHole.x;
        const dy = (s.y + s.size / 2) - blackHole.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < blackHole.radius) {
            score += s.points * scoreMultiplier;
            scoreDisplay.textContent = "Score: " + score;
            return false;
        }
        return true;
    });
}

// ---------------------- DRAW ----------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Black hole
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();

    ctx.strokeStyle = "purple";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let s of shapes) drawShape(s);
}

// ---------------------- GAME LOOP ----------------------
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// ---------------------- UPGRADES ----------------------
const upgrades = {
    biggerHole: { 
        cost: 10, 
        apply: () => blackHole.radius += 20 
    },

    doublePoints: { 
        cost: 20, 
        apply: () => {
            if (scoreMultiplierLevel < scoreMultiplierMax) {
                scoreMultiplierLevel++;
                scoreMultiplier = 1 + scoreMultiplierLevel;
            }
        }
    },

    autoCollector: { 
        cost: 30, 
        apply: () => {
            if (autoCollectorLevel < autoCollectorMax) {
                autoCollectorLevel++;
                autoCollector = true;
            }
        }
    }
};

function buyUpgrade(name) {
    const u = upgrades[name];
    if (score >= u.cost) {
        score -= u.cost;
        u.apply();
        scoreDisplay.textContent = "Score: " + score;
    }
}

// ---------------------- ANNOUNCE ----------------------
function announce(text) {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.position = "absolute";
    div.style.top = "50%";
    div.style.left = "50%";
    div.style.transform = "translate(-50%, -50%)";
    div.style.color = "white";
    div.style.fontSize = "40px";
    div.style.opacity = "1";
    div.style.transition = "opacity 1s";
    document.body.appendChild(div);

    setTimeout(() => div.style.opacity = "0", 100);
    setTimeout(() => div.remove(), 1100);
}
