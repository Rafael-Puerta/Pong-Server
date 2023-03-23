function run(fps) {

    if (fps < 1) return;

    const boardWidth = cnv.getWidth();
    const boardHeight = cnv.getHeight();

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
    const lineBall = { {ballX, ballY}, {ballNextX, ballNextY} };

    const lineBoardLeft = { {borderSize, 0}, {borderSize, boardHeight} };
    const intersectionLeft = findIntersection(lineBall, lineBoardLeft);

    const boardMaxX = boardWidth - borderSize;
    const lineBoardRight = { {boardMaxX, 0}, {boardMaxX, boardHeight} };
    const intersectionRight = findIntersection(lineBall, lineBoardRight);

    const lineBoardTop = { {0, borderSize}, {boardWidth, borderSize} };
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
    const linePlayer = { {playerX - playerHalf, playerY}, {playerX + playerHalf, playerY} };
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
    playerY = cnv.getHeight() - playerHeight - 10;
}

