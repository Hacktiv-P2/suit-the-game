import React, { useState, useEffect } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "../firebase";
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from "react-router-dom"; // Import useParams

const Game = () => {
  const { gameId: routeGameId } = useParams(); // Get gameId from params
  const [gameId, setGameId] = useState(routeGameId || ""); // Set gameId from params if available
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [gameData, setGameData] = useState(null);
  const [inputGameId, setInputGameId] = useState(routeGameId || ""); // Use gameId from params for joining
  const [hasChosen, setHasChosen] = useState(false); 
  const [gameFinished, setGameFinished] = useState(false); 
  const [countdown, setCountdown] = useState(0); 
  const [player1Lives, setPlayer1Lives] = useState(3);
  const [player2Lives, setPlayer2Lives] = useState(3);
  
  const createGame = () => {
    const newGameId = Date.now().toString();
    const gameRef = ref(db, "games/" + newGameId);
    set(gameRef, {
      player1: { choice: "", lives: 3 },
      player2: { choice: "", lives: 3 },
      status: "waiting",
    }).then(() => {
      setGameId(newGameId);
      setCurrentPlayer("player1");
      setHasChosen(false);
      setGameFinished(false); 
      setPlayer1Lives(3); 
      setPlayer2Lives(3);
    });
  };

  const joinGame = async () => {
    const gameRef = ref(db, "games/" + inputGameId);
    try {
      const snapshot = await get(gameRef);
      const data = snapshot.val();
      if (data && data.status === "waiting") {
        setGameId(inputGameId);
        setCurrentPlayer("player2");
        await update(gameRef, { status: "ready" });
        setInputGameId("");
        setHasChosen(false);
      } else {
        toast.error("Game tidak tersedia atau sudah dimulai");
      }
    } catch (error) {
      console.error("Error joining game: ", error);
      toast.error("Terjadi kesalahan saat bergabung ke game");
    }
  };

  const handleChoice = (choice) => {
    const gameRef = ref(db, "games/" + gameId);
    if (!hasChosen && !gameFinished) {
      if (currentPlayer === "player1") {
        update(gameRef, { "player1/choice": choice });
      } else if (currentPlayer === "player2") {
        update(gameRef, { "player2/choice": choice });
      }
      setHasChosen(true); 
    }
  };

  const getRandomChoice = () => {
    const choices = ["rock", "paper", "scissors"];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const handleTimeout = async () => {
    setTimerActive(false);
    setHasChosen(true);
    const gameRef = ref(db, "games/" + gameId);

    const updates = {};
    if (!gameData.player1.choice) {
      updates["player1/choice"] = getRandomChoice();
    }
    if (!gameData.player2.choice) {
      updates["player2/choice"] = getRandomChoice();
    }

    if (Object.keys(updates).length > 0) {
      await update(gameRef, updates);
    }

    update(gameRef, { status: "timeout" });
  };

  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGameData(data);

        if (data?.player1?.lives !== player1Lives || data?.player2?.lives !== player2Lives) {
          setPlayer1Lives(data?.player1?.lives || 3);
          setPlayer2Lives(data?.player2?.lives || 3);
        }

        if (data?.player1?.lives === 0 || data?.player2?.lives === 0) {
          setGameFinished(true);
          setCountdown(5);
        }

        if (data?.player1?.choice && data?.player2?.choice && !gameFinished) {
          const result = determineWinner(data.player1.choice, data.player2.choice);
          handleLivesUpdate(result);
        }
      });
    }
  }, [gameId, gameFinished, player1Lives, player2Lives]);

  const handleLivesUpdate = (result) => {
    let newPlayer1Lives = player1Lives;
    let newPlayer2Lives = player2Lives;

    if (result === "Player 1 wins") {
      newPlayer2Lives = Math.max(player2Lives - 1, 0);
    } else if (result === "Player 2 wins") {
      newPlayer1Lives = Math.max(player1Lives - 1, 0);
    }

    const gameRef = ref(db, "games/" + gameId);
    update(gameRef, {
      "player1/lives": newPlayer1Lives,
      "player2/lives": newPlayer2Lives,
      "player1/choice": "",
      "player2/choice": ""
    }).then(() => {
      setPlayer1Lives(newPlayer1Lives);
      setPlayer2Lives(newPlayer2Lives);

      if (newPlayer1Lives === 0 || newPlayer2Lives === 0) {
        setGameFinished(true);
        setCountdown(5);
        if (newPlayer1Lives === 0) {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Pemain 1 kalah!',
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              icon: 'error',
              title: 'Maaf!',
              text: 'Kamu kalah!',
            });
          } else if (currentPlayer === "player2") {
            Swal.fire({
              icon: 'success',
              title: 'Selamat!',
              text: 'Kamu menang!',
            });
          }
        } else if (newPlayer2Lives === 0) {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Pemain 2 kalah!',
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              icon: 'success',
              title: 'Selamat!',
              text: 'Kamu menang!',
            });
          } else if (currentPlayer === "player2") {
            Swal.fire({
              icon: 'error',
              title: 'Maaf!',
              text: 'Kamu kalah!',
            });
          }
        }
      } else {
        setHasChosen(false);
      }
    });
  };

  const [selectionCountdown, setSelectionCountdown] = useState(10);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (gameData && gameData.status === "ready" && !gameFinished) {
      if (!timerActive) {
        setTimerActive(true);
        setSelectionCountdown(10);
      }
    }
    if (gameFinished) {
      setSelectionCountdown(0);
    }
  }, [gameData, gameFinished, timerActive]);

  useEffect(() => {
    let timer;
    if (timerActive && selectionCountdown > 0) {
      timer = setTimeout(() => {
        setSelectionCountdown(selectionCountdown - 1);
      }, 1000);
    } else if (selectionCountdown === 0) {
      handleTimeout();
    }
    return () => clearTimeout(timer);
  }, [selectionCountdown, timerActive]);

  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        toast.success("Permainan selesai dan game telah dihapus.");
        setGameId("");
        setHasChosen(false);
        setGameFinished(false);
      })
      .catch((error) => {
        console.error("Gagal menghapus game: ", error);
      });
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && gameFinished) {
      deleteGame();
    }
    return () => clearTimeout(timer);
  }, [countdown, gameFinished]);

  const determineWinner = (choice1, choice2) => {
    if (choice1 === choice2) return "Draw";
    if (
      (choice1 === "rock" && choice2 === "scissors") ||
      (choice1 === "scissors" && choice2 === "paper") ||
      (choice1 === "paper" && choice2 === "rock")
    ) {
      return "Player 1 wins";
    }
    return "Player 2 wins";
  };

  return (
    <div>
      <ToastContainer />
      <div>
        {!gameId ? (
          <>
            <h1>Rock Paper Scissors Multiplayer</h1>
            <button onClick={createGame}>Create Game</button>
            <input
              type="text"
              placeholder="Masukkan ID Game"
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
            />
            <button onClick={joinGame}>Join Game</button>
          </>
        ) : (
          <>
            <h2>Game ID: {gameId}</h2>
            <p>Pemain saat ini: {currentPlayer}</p>
            <div>
              <h3>Pilih pilihanmu:</h3>
              <button onClick={() => handleChoice("rock")}>Rock</button>
              <button onClick={() => handleChoice("paper")}>Paper</button>
              <button onClick={() => handleChoice("scissors")}>Scissors</button>
            </div>
            <p>Player 1 lives: {player1Lives}</p>
            <p>Player 2 lives: {player2Lives}</p>
            <p>Countdown: {selectionCountdown}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
