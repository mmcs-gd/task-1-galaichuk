const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');

    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPlatform(context)
    drawBall(context)
}

function update(tick) {

    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

    const ball = gameState.ball
    handleBallCollisions()

    ball.y += ball.vy
    ball.y += ball.vx
}

function handleBallCollisions(divingFactor){
    // setting the default for diving factor
    divingFactor = typeof divingFactor !== 'undefined' ? divingFactor : 0.9
    const ball =  gameState.ball
    const ballDivingRadius = ball.radius * divingFactor

    handleScreenBorderCollision(ball, ballDivingRadius)
}

function handleScreenBorderCollision(projectile, ballDivingRadius){
    // Calculating ball collisions with sides and cieling of the playing screen
    const isOutOfHorizontalBounds =  projectile.x - ballDivingRadius <= 0 
                                    || projectile.x + ballDivingRadius > canvas.width
    const isOutOfVerticalBounds = projectile.y - ballDivingRadius  <= 0 

    // If the ball has fallen on the 'ground' -- stop the game
    if(projectile.y + ballDivingRadius  > canvas.height){
        stopGame(gameState.stopCycle)
    }
    if(isOutOfHorizontalBounds){
        projectile.vx *= -1
    }
    if(isOutOfVerticalBounds){
        projectile.vy *= -1
    }
}

function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height} = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = "#FF0000";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#0000FF";
    context.fill();
    context.closePath();
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms

    const platform = {
        width: 400,
        height: 50,
    };

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height
    };
    gameState.pointer = {
        x: 0,
        y: 0,
    };
    gameState.ball = {
        x: canvas.width / 2,
        y:  30,
        radius: 25,
        vx: 0,
        vy: 5
    }
}

setup();
run();
