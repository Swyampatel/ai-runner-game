import React, { useEffect, useRef, useState } from "react";
import "./App.css"; // ✅ Import the updated CSS file

const Game = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // ✅ New state to track if the game has started
  const playerId = "player1";
  let socket = useRef(null);
  let animationFrameId = null;

  useEffect(() => {
    socket.current = new WebSocket(`wss://ai-runner-game.onrender.com/game/${playerId}`);

    socket.current.onopen = () => console.log("✅ WebSocket Connected!");
    socket.current.onerror = (error) => console.error("❌ WebSocket Error:", error);
    socket.current.onclose = () => console.warn("⚠️ WebSocket Disconnected. Attempting to reconnect...");

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ✅ Only update difficulty if it has changed
      if (data.difficulty !== difficulty) {
        setDifficulty(data.difficulty);
      }
    };

    return () => {
      socket.current.close();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = Math.min(window.innerWidth - 20, 500);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let player = { x: 50, y: 160, width: 25, height: 25, velocityY: 0, isJumping: false };
    let obstacles = [];
    let gameSpeed = 3 + difficulty;
    let gravity = 0.5;
    let scoreCounter = 0;

    function drawPlayer() {
      ctx.fillStyle = "#3498db";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawObstacles() {
      ctx.fillStyle = "#e74c3c";
      obstacles.forEach((obstacle) => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });
    }

    function updateObstacles() {
      if (!gameStarted) return; // ✅ Don't generate obstacles until the game starts

      if (Math.random() < 0.015 * difficulty) {
        obstacles.push({ x: canvas.width, y: 175, width: 15, height: 25 });
      }
      obstacles.forEach((obstacle) => (obstacle.x -= gameSpeed));
      obstacles = obstacles.filter((obstacle) => obstacle.x > -30);
    }

    function updatePlayer() {
      if (!gameStarted) return; // ✅ Prevent movement before game starts

      player.velocityY += gravity;
      player.y += player.velocityY;

      if (player.y >= 160) {
        player.y = 160;
        player.velocityY = 0;
        player.isJumping = false;
      }
    }

    function detectCollision() {
      if (!gameStarted) return;

      for (let obstacle of obstacles) {
        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y
        ) {
          setGameOver(true);
          cancelAnimationFrame(animationFrameId);

          const finalScore = Math.floor(scoreCounter / 50);

          setTimeout(() => {
            alert(`Game Over! Your Score: ${finalScore}`);
            window.location.reload();
          }, 200);

          return;
        }
      }
    }

    function gameLoop() {
      if (gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPlayer();
      drawObstacles();
      updatePlayer();
      updateObstacles();
      detectCollision();

      if (gameStarted) {
        scoreCounter += 1;
        const newScore = Math.floor(scoreCounter / 50);

        if (newScore !== score) {
          setScore(newScore);
          if (socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ score: newScore }));
          }
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleJump() {
      if (!gameStarted) {
        setGameStarted(true); // ✅ Start the game on first jump
      }
      if (!player.isJumping && !gameOver) {
        player.isJumping = true;
        player.velocityY = -10;
      }
    }

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") handleJump();
    });

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener("keydown", handleJump);
      cancelAnimationFrame(animationFrameId);
    };
  }, [difficulty, gameOver, gameStarted]);

  return (
    <div className="game-container">
      <h1 className="game-title">🚀 AI-Powered Runner Game</h1>
      {!gameStarted && <p className="start-text">Press <strong>Spacebar</strong>  or tap the button to Start!</p>} {/* ✅ Show message before game starts */}
      <div className="scoreboard">
        <p>🏆 Score: <span>{score}</span></p>
      </div>
      <div className="game-box">
        <canvas ref={canvasRef} height={200} className="game-canvas"></canvas>
      </div>
      <button className="mobile-jump-btn" onClick={() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
      }}>
        Jump
      </button>
      <p className="instructions">Press <strong>Spacebar</strong> or tap the button to jump over obstacles!</p>
    </div>
  );
};

export default Game;
