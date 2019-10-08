const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY;
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

    drawPlatform(context);
    drawBall(context);
    drawScoreCounter(context);
}

function update(tick) {
    const vx = (gameState.pointer.x - gameState.player.x) / 10;
    gameState.player.x += vx;

    const ball = gameState.ball;
    ball.y += ball.vy;
    ball.x += ball.vx;
    handleBallCollisions();
    updateScoreCounter();
    updateBallSpeed();
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

function handleBallCollisions(divingFactor) {
    // Setting the default for diving factor
    divingFactor = typeof divingFactor !== 'undefined' ? divingFactor : 0.9;

    const ball = gameState.ball;
    const ballDivingRadius = ball.radius * divingFactor;
    // Stop the game if the bottom screen border is hit
    handleScreenBorderCollision(ball, ballDivingRadius, function () {
        stopGame(gameState.stopCycle);
    });
    handlePaddleCollision(ball, ballDivingRadius, function () {
        let angleSign = Math.sign(ball.vx);
        /*
         Assign the absolute value of y-axis velocity to the x-axis velocity
         to ensure that the ball stays with the same speed, and reflect it by its own sign
                /             \ 
               /      =>       \  
            -----             -----
        First iteration (Vx == 0) x-velocity sign is chosen randomly by the following rule:
            2 * Math.round(Math.random()) - 1. 
        It's a magic part, resulting in either -1 or 1
        */
        ball.vx = (angleSign == 0 ? 2 * Math.round(Math.random()) - 1 : angleSign) * Math.abs(ball.vy);
        ball.vy *= -1;
    });
}

// simple function to check if the projectile hits the paddle
function checkPaddleHitPlacement(projectilePoint) {
    const paddleWidth = gameState.player.width / 2;
    return projectilePoint > gameState.player.x - paddleWidth
        && projectilePoint < gameState.player.x + paddleWidth;
}

function handlePaddleCollision(projectile, ballDivingRadius, collisionHandler) {
    const player = gameState.player;
    // Check if the top of the paddle is hit
    const isHitFromAbove = projectile.y + ballDivingRadius >= player.y - player.height / 2;

    // Check if the ball hit the paddles` horizontal plane by any side from the center
    const didHitWithRightSide = checkPaddleHitPlacement(projectile.x + projectile.radius);
    const didHitWithLeftSide = checkPaddleHitPlacement(projectile.x - projectile.radius);

    if (isHitFromAbove && (didHitWithRightSide || didHitWithLeftSide)) {
        collisionHandler();
    }
}
function handleScreenBorderCollision(projectile, ballDivingRadius, bottomCollisionHandler) {
    // Calculating ball collisions with sides and cieling of the playing screen
    const isOutOfHorizontalBounds = projectile.x - ballDivingRadius <= 0
        || projectile.x + ballDivingRadius > canvas.width;
    const isOutOfVerticalBounds = (projectile.y - ballDivingRadius <= 0) && projectile.vy < 0;

    // If the ball has fallen on the 'ground' -- stop the game
    if (projectile.y + ballDivingRadius > canvas.height) {
        bottomCollisionHandler();
        return;
    }
    if (isOutOfHorizontalBounds) {
        projectile.vx *= -1;
    }
    if (isOutOfVerticalBounds) {
        projectile.vy *= -1;
    }
}

function updateScoreCounter() {
    if (gameState.lastTick - gameState.lastScoreUpdateTime >= 1000) {
        gameState.scoreCounter.currentScore++;
        gameState.lastScoreUpdateTime = gameState.lastTick;
    }
}

function updateBallSpeed() {
    if (gameState.lastTick - gameState.lastBallSpeedChangeTime >= 5000) {
        gameState.ball.vy *= 1.1;
        gameState.ball.vx *= 1.1;
        gameState.lastBallSpeedChangeTime = gameState.lastTick;
    }
}

function drawPlatform(context) {
    const { x, y, width, height } = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = "#FF0000";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const { x, y, radius } = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#0000FF";
    context.fill();
    context.closePath();
}

function drawScoreCounter(context) {
    const { x, y, width, height, currentScore } = gameState.scoreCounter;
    context.font = "124px Bitwise";
    context.fillStyle = "#323459";
    context.fillText(currentScore, x + width / 2, y + height / 2 + 5);
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);
    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    gameState.lastScoreUpdateTime = 0;
    gameState.lastBallSpeedChangeTime = 0;

    // Load custom bitwise font
    var bitwiseFont = new FontFace('Bitwise', 'url(fonts/bitwise.ttf)');
    bitwiseFont.load().then(function (loaded_face) {
        document.fonts.add(loaded_face);
        document.body.style.fontFamily = '"Bitwise", Arial';
    }).catch(function (error) { });

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
        y: 0,
        radius: 25,
        vx: 0,
        vy: 5
    };
    gameState.scoreCounter = {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        currentScore: 0
    }
}

setup();
run();
