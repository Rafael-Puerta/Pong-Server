var borderSize = 5;
var playerPoints = 0;
var playerX = Number.POSITIVE_INFINITY;
var playerY = Number.POSITIVE_INFINITY;

var playerWidth = 200;
var playerHalf = playerWidth / 2;
var playerHeight = 5;
var playerSpeed = 250;
var playerSpeedIncrement = 15;
var playerDirection = "none";

var ballX = Number.POSITIVE_INFINITY;
var ballY = Number.POSITIVE_INFINITY;
var ballSize = 15;
var ballHalf = ballSize / 2;
var ballSpeed = 200;
var ballSpeedIncrement = 25;
var ballDirection = "upRight";

function run(fps) {

    if (fps < 1) return;

    const boardWidth = 800;
    const boardHeight = 600;

    // Move player
    switch (playerDirection) {
        case "right":
            playerX = playerX + playerSpeed / fps; 
            break;
        case "left":
            playerX = playerX - playerSpeed / fps;
            break;
    }

    // Keep player in bounds
    const playerMinX = playerHalf;
    const playerMaxX = boardWidth - playerHalf;

    if (playerX < playerMinX) {

        playerX = playerMinX;

    } else if (playerX > playerMaxX) {

        playerX = playerMaxX;
    }

    // Move ball
    let ballNextX = ballX;
    let ballNextY = ballY;
    switch (ballDirection) {
        case "upRight": 
            ballNextX = ballX + ballSpeed / fps;
            ballNextY = ballY - ballSpeed / fps;
            break;
        case "upLeft": 
            ballNextX = ballX - ballSpeed / fps;
            ballNextY = ballY - ballSpeed / fps;
            break;
        case "downRight": 
            ballNextX = ballX + ballSpeed / fps;
            ballNextY = ballY + ballSpeed / fps;
            break;
        case "downLeft": 
            ballNextX = ballX - ballSpeed / fps;
            ballNextY = ballY + ballSpeed / fps;
            break;
    }

    // Check ball collision with board sides
    const lineBall = [[ballX, ballY], [ballNextX, ballNextY]];

    const lineBoardLeft = [[borderSize, 0], [borderSize, boardHeight]];
    const intersectionLeft = findIntersection(lineBall, lineBoardLeft);

    const boardMaxX = boardWidth - borderSize;
    const lineBoardRight = [[boardMaxX, 0], [boardMaxX, boardHeight]];
    const intersectionRight = findIntersection(lineBall, lineBoardRight);

    const lineBoardTop = [[0, borderSize], [boardWidth, borderSize]];
    const intersectionTop = findIntersection(lineBall, lineBoardTop);

    if (intersectionLeft != null) {
        switch (ballDirection) {
            case "upLeft": 
                ballDirection = "upRight";
                break;
            case "downLeft": 
                ballDirection = "downRight";
                break;
        }
        ballX = intersectionLeft[0] + 1;
        ballY = intersectionLeft[1];

    } else if (intersectionRight != null) {

        switch (ballDirection) {
            case "upRight": 
                ballDirection = "upLeft";
                break;
            case "downRight": 
                ballDirection = "downLeft";
                break;
        }
        ballX = intersectionRight[0] - 1;
        ballY = intersectionRight[1];

    } else if (intersectionTop != null) {

        switch (ballDirection) {
            case "upRight": 
                ballDirection = "downRight"; 
                break;
            case "upLeft": 
                ballDirection = "downLeft"; 
                break;
        }
        ballX = intersectionTop[0];
        ballY = intersectionTop[1] + 1;

    } else {
        if (ballNextY > boardHeight) {
            gameStatus = "gameOver";
        } else {
            ballX = ballNextX;
            ballY = ballNextY;
        }
    }

    // Check ball collision with player
    const linePlayer = [[playerX - playerHalf, playerY], [playerX + playerHalf, playerY]];
    const intersectionPlayer = findIntersection(lineBall, linePlayer);

    if (intersectionPlayer != null) {

        switch (ballDirection) {
            case "downRight": 
                ballDirection = "upRight";
                break;
            case "downLeft": 
                ballDirection = "upLeft";
                break;
        }
        ballX = intersectionPlayer[0];
        ballY = intersectionPlayer[1] - 1;
        playerPoints = playerPoints + 1;
        ballSpeed = ballSpeed + ballSpeedIncrement;
        playerSpeed = playerSpeed + playerSpeedIncrement;
    }

    // Set player Y position
    playerY = 600 - playerHeight - 10;
}

function findIntersection(lineA, lineB) {
    result = 0.00;

    const aX0 = lineA[0][0];
    const aY0 = lineA[0][1];
    const aX1 = lineA[1][0];
    const aY1 = lineA[1][1];

    const bX0 = lineB[0][0];
    const bY0 = lineB[0][1];
    const bX1 = lineB[1][0];
    const bY1 = lineB[1][1];

    var x, y;

    if (aX1 == aX0) { // lineA is vertical
        if (bX1 == bX0) { // lineB is vertical too
            return null;
        }
        x = aX0;
        const bM = (bY1 - bY0) / (bX1 - bX0);
        const bB = bY0 - bM * bX0;
        y = bM * x + bB;
    } else if (bX1 == bX0) { // lineB is vertical
        x = bX0;
        const aM = (aY1 - aY0) / (aX1 - aX0);
        const aB = aY0 - aM * aX0;
        y = aM * x + aB;
    } else {
        const aM = (aY1 - aY0) / (aX1 - aX0);
        const aB = aY0 - aM * aX0;

        const bM = (bY1 - bY0) / (bX1 - bX0);
        const bB = bY0 - bM * bX0;

        const tolerance = 1e-5;
        if (Math.abs(aM - bM) < tolerance) { 
            return null;
        }

        x = (bB - aB) / (aM - bM);
        y = aM * x + aB;
    }

    // Check if the intersection point is within the bounding boxes of both line segments
    const boundingBoxTolerance = 1e-5;
    const withinA = x >= Math.min(aX0, aX1) - boundingBoxTolerance &&
                            x <= Math.max(aX0, aX1) + boundingBoxTolerance &&
                            y >= Math.min(aY0, aY1) - boundingBoxTolerance &&
                            y <= Math.max(aY0, aY1) + boundingBoxTolerance;
    const withinB = x >= Math.min(bX0, bX1) - boundingBoxTolerance &&
                            x <= Math.max(bX0, bX1) + boundingBoxTolerance &&
                            y >= Math.min(bY0, bY1) - boundingBoxTolerance &&
                            y <= Math.max(bY0, bY1) + boundingBoxTolerance;

    if (withinA && withinB) {
        result[0] = x;
        result[1] = y;
    } else {
        return null;
    }

    return result;
}
module.exports={run}