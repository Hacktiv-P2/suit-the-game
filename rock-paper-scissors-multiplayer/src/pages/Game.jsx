import React, { useState, useEffect } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "../firebase";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams

const Game = () => {
  const { gameId: routeGameId } = useParams(); // Get gameId from params
  const [gameId, setGameId] = useState(routeGameId || ""); // Set gameId from params if available
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [gameData, setGameData] = useState(null);
  const [hasChosen, setHasChosen] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [player1Lives, setPlayer1Lives] = useState(3);
  const [player2Lives, setPlayer2Lives] = useState(3);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const playerName = localStorage.getItem("suit_username");
  const [timer, setTimer] = useState(5); // Timer starts from 5 seconds
  const navigate = useNavigate();

  const handleChoice = (choice) => {
    console.log(`Player ${currentPlayer} chose: ${choice}`);
    const gameRef = ref(db, "games/" + gameId);
    if (!gameId) {
      Swal.fire({
        icon: "warning",
        title: "Room Not Found!",
        text: "Room Tidak ditemukan.",
      });
      navigate("/rooms");
    } else if (!hasChosen && !gameFinished) {
      if (currentPlayer === "player1") {
        update(gameRef, { "player1/choice": choice });
      } else if (currentPlayer === "player2") {
        update(gameRef, { "player2/choice": choice });
      }
      setHasChosen(true);
      setTimer(5); // Reset the timer for the next player/round
    }
  };

  const randomChoice = () => {
    const choices = ["rock", "paper", "scissors"];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const joinGame = () => {
    const gameRef = ref(db, "games/" + gameId);

    get(gameRef).then(async (snapshot) => {
      const data = snapshot.val();
      console.log("Game data on join:", data);

      // Ensure both player1 and player2 keys exist to avoid undefined errors
      const player1Exists = data && data.player1 && data.player1.name;
      const player2Exists = data && data.player2 && data.player2.name;
      console.log(
        "Player 1 exists:",
        player1Exists,
        "Player 2 exists:",
        player2Exists
      );
      console.log(data.status);

      if (player1Exists && player2Exists) {
        await update(gameRef, { status: "ready" });
      }

      if (!player1Exists) {
        // Tidak ada Player 1, assign current player sebagai Player 1
        update(gameRef, {
          "player1/name": playerName, // Hanya update nama untuk menghindari data lain ter-overwrite
        });
        setCurrentPlayer("player1");
        setPlayer1Name(playerName);
      } else if (player1Exists && data.player1.name === playerName) {
        // Reconnect sebagai Player 1 jika nama cocok
        setCurrentPlayer("player1");
        setPlayer1Name(playerName);
      } else if (!player2Exists) {
        // Tidak ada Player 2, assign current player sebagai Player 2
        update(gameRef, {
          "player2/name": playerName, // Hanya update nama untuk menghindari data lain ter-overwrite
        });
        setCurrentPlayer("player2");
        setPlayer2Name(playerName);
      } else if (player2Exists && data.player2.name === playerName) {
        // Reconnect sebagai Player 2 jika nama cocok
        setCurrentPlayer("player2");
        setPlayer2Name(playerName);
      } else {
        // Jika kedua player sudah ada, tampilkan pesan
        Swal.fire({
          icon: "warning",
          title: "Room Penuh!",
          text: "Game ini sudah memiliki dua pemain.",
        });
      }
    });
  };

  // Run `joinGame` only once after the component loads
  useEffect(() => {
    if (gameId) {
      joinGame();
    }
  }, [player1Name, player2Name]); // Ensure it runs only once after `gameId` is set

  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Data snapshot: ", data);
        setGameData(data);
        if (
          data?.player1?.lives !== player1Lives ||
          data?.player2?.lives !== player2Lives
        ) {
          setPlayer1Lives(data?.player1?.lives || 3);
          setPlayer2Lives(data?.player2?.lives || 3);
        }
        if (data?.player1?.name) setPlayer1Name(data.player1.name);
        if (data?.player2?.name) setPlayer2Name(data.player2.name);

        if (data?.player1?.lives === 0 || data?.player2?.lives === 0) {
          console.log("Game is finished");
          setGameFinished(true);
          setCountdown(5);
        }
        if (data?.player1?.choice && data?.player2?.choice && !gameFinished) {
          const result = determineWinner(
            data.player1.choice,
            data.player2.choice
          );
          console.log("Round result:", result);
          handleLivesUpdate(result);
        }
      });
    }
  }, [gameId, gameFinished, player1Lives, player2Lives]);

  useEffect(() => {
    let timerInterval;
    console.log("Has chosen:", hasChosen, "Timer:", timer);
    if (!hasChosen && !gameFinished && timer > 0) {
      timerInterval = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0 && !hasChosen && !gameFinished) {
      const choice = randomChoice(); // Random choice for the current player
      console.log("Timer expired, random choice:", choice);

      handleChoice(choice);
    }

    return () => clearTimeout(timerInterval); // Cleanup timer
  }, [timer, hasChosen, gameFinished]);

  const handleLivesUpdate = (result) => {
    let newPlayer1Lives = player1Lives;
    let newPlayer2Lives = player2Lives;

    if (result === "Player 1 wins") {
      newPlayer2Lives = Math.max(player2Lives - 1, 0);
    } else if (result === "Player 2 wins") {
      newPlayer1Lives = Math.max(player1Lives - 1, 0);
    }

    console.log(
      "Lives updated: Player 1:",
      newPlayer1Lives,
      "Player 2:",
      newPlayer2Lives
    );

    const gameRef = ref(db, "games/" + gameId);
    update(gameRef, {
      "player1/lives": newPlayer1Lives,
      "player2/lives": newPlayer2Lives,
      "player1/choice": "",
      "player2/choice": "",
    }).then(() => {
      setPlayer1Lives(newPlayer1Lives);
      setPlayer2Lives(newPlayer2Lives);

      if (newPlayer1Lives === 0 || newPlayer2Lives === 0) {
        setGameFinished(true);
        setCountdown(5);
        if (newPlayer1Lives === 0) {
          Swal.fire({
            icon: "error",
            title: "Maaf!",
            text: "Pemain 1 kalah!",
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              icon: "error",
              title: "Maaf!",
              text: "Kamu kalah!",
            });
          } else if (currentPlayer === "player2") {
            Swal.fire({
              icon: "success",
              title: "Selamat!",
              text: "Kamu menang!",
            });
          }
        } else if (newPlayer2Lives === 0) {
          Swal.fire({
            icon: "error",
            title: "Maaf!",
            text: "Pemain 2 kalah!",
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              icon: "success",
              title: "Selamat!",
              text: "Kamu menang!",
            });
          } else if (currentPlayer === "player2") {
            Swal.fire({
              icon: "error",
              title: "Maaf!",
              text: "Kamu kalah!",
            });
          }
        }
      } else {
        setHasChosen(false);
      }
    });
  };

  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        console.log("Game deleted");
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
      toast.success("Permainan selesai dan game telah dihapus.", {
        autoClose: 3000, // Timeout 5 detik
      });
      setTimeout(() => {
        navigate("/rooms");
      }, 3000);
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
        <>
          <h2>Game ID: {gameId}</h2>
          <p>Pemain saat ini: {currentPlayer}</p>
          <div>
            <h3>Pilih pilihanmu:</h3>
            <button onClick={() => handleChoice("rock")}>Rock</button>
            <button onClick={() => handleChoice("paper")}>Paper</button>
            <button onClick={() => handleChoice("scissors")}>Scissors</button>
          </div>
          <p>
            Player 1 ({player1Name}) lives: {player1Lives}
          </p>{" "}
          {/* Tampilkan nama Player 1 */}
          <p>
            Player 2 ({player2Name}) lives: {player2Lives}
          </p>{" "}
          {/* Tampilkan nama Player 2 */}
          <p>Timer: {timer} seconds</p>
        </>
      </div>
    </div>
  );
};

export default Game;
