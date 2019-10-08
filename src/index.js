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
    if (gameState.bonusProjectile.exists) {
        drawBonusProjectile(context);
    }
}

function update(tick) {
    const vx = (gameState.pointer.x - gameState.player.x) / 10;
    gameState.player.x += vx;

    const ball = gameState.ball;

    handleBallCollisions();
    handleBonusCollisions();

    updateScoreCounter();
    updateBallSpeed();

    if (gameState.bonusProjectile.exists) {
        const bonusProjectile = gameState.bonusProjectile;
        bonusProjectile.x += bonusProjectile.vx;
        bonusProjectile.y += bonusProjectile.vy;
    } else if (gameState.lastTick - gameState.lastBonusCreated >= 5000) {
        createRandomBonusProjectile();
    }

    ball.y += ball.vy;
    ball.x += ball.vx;
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

function createRandomBonusProjectile() {
    const bonusProjectile = gameState.bonusProjectile;
    bonusProjectile.x = getRandomInteger(50, canvas.width - 50);
    bonusProjectile.y = getRandomInteger(50, canvas.height * 0.3);
    bonusProjectile.radius = getRandomInteger(20, 30);
    bonusProjectile.vx = getRandomInteger(-6, 7);
    bonusProjectile.vy = getRandomInteger(1, 4);
    bonusProjectile.exists = true;
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

function handleBonusCollisions() {
    const bonusProjectile = gameState.bonusProjectile;
    if (!bonusProjectile.exists) return;
    handleScreenBorderCollision(bonusProjectile, bonusProjectile.radius, function () {
        bonusProjectile.exists = false;
        gameState.lastBonusCreated = gameState.lastTick;
    })
    handlePaddleCollision(bonusProjectile, bonusProjectile.radius, function () {
        gameState.scoreCounter.currentScore += 15;
        bonusProjectile.exists = false;
        gameState.lastBonusCreated = gameState.lastTick;
    })
}
// simple function to check if the projectile hits the paddle
function checkPaddleHitPlacement(projectilePoint, referencePoint) {
    return projectilePoint > gameState.player.x - referencePoint
        && projectilePoint < gameState.player.x + referencePoint;
}

function handlePaddleCollision(projectile, ballDivingRadius, collisionHandler) {
    const player = gameState.player;
    // Check if the top of the paddle is hit
    const isHitFromAbove = projectile.y + ballDivingRadius >= player.y - player.height / 2;

    const paddleWidth = gameState.player.width / 2;
    const paddleHeight = gameState.player.height / 2;

    // Check if the ball hit the paddles` horizontal plane by any side from the center
    const fitsToPaddleFromLeft = checkPaddleHitPlacement(projectile.x + projectile.radius, paddleWidth);
    const fitsToPaddleFromRight = checkPaddleHitPlacement(projectile.x - projectile.radius, paddleWidth);

    // const rightEndPaddleHit = checkPaddleHitPlacement(projectile.y + projectile.radius, paddleHeight);
    // const leftEndPaddleHit = checkPaddleHitPlacement(projectile.y - projectile.radius, paddleHeight);

    // const isHitFromOther = rightEndPaddleHit || leftEndPaddleHit;
    if (isHitFromAbove && (fitsToPaddleFromRight || fitsToPaddleFromLeft)) {
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
    // This block will never execute for projectiles, who are not able to move upwards
    // E.g. bonuses
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

function getRandomInteger(lowerBound, upperBound) {
    return Math.random() * (upperBound - lowerBound) + lowerBound;
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
    context.textAlign = "center";
    context.fillStyle = "#323459";
    context.fillText(currentScore, x + width / 2, y + height / 2 + 5);
}

function drawBonusProjectile(context) {
    const { x, y, radius } = gameState.bonusProjectile;
    context.beginPath();
    context.rect(x, y, radius / 3, radius)
    context.rect(x - radius / 3, y + radius / 3, radius, radius / 3)
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
    gameState.lastScoreUpdateTime = 0;
    gameState.lastBallSpeedChangeTime = 0;
    gameState.lastBonusCreated = 0;

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
    gameState.bonusProjectile = {
        x: 0,
        y: 0,
        radius: 0,
        vx: 0,
        vy: 0,
        exists: false
    }
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
