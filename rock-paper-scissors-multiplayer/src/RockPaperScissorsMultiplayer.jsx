import React, { useState, useEffect } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "./firebase";
import Swal from 'sweetalert2';

const RockPaperScissorsMultiplayer = () => {
  const [gameId, setGameId] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [gameData, setGameData] = useState(null);
  const [inputGameId, setInputGameId] = useState("");
  const [hasChosen, setHasChosen] = useState(false); 
  const [gameFinished, setGameFinished] = useState(false); 
  const [countdown, setCountdown] = useState(0); 

  const [player1Lives, setPlayer1Lives] = useState(3);
  const [player2Lives, setPlayer2Lives] = useState(3);

  // Membuat game baru
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

  // Bergabung ke game
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
        alert("Game tidak tersedia atau sudah dimulai");
      }
    } catch (error) {
      console.error("Error joining game: ", error);
      alert("Terjadi kesalahan saat bergabung ke game");
    }
  };

  // Pemain membuat pilihan
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

  // Pantau data game dari Firebase
  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGameData(data);

        // Jika salah satu pemain nyawanya sudah 0, maka game berakhir dan dihapus
        if (data?.player1?.lives === 0 || data?.player2?.lives === 0) {
          setGameFinished(true);
          setCountdown(10);
          deleteGame(); // Hapus game dari database
        }

        // Jika kedua pemain sudah memilih, tentukan pemenang
        if (data?.player1?.choice && data?.player2?.choice && !gameFinished) {
          const result = determineWinner(data.player1.choice, data.player2.choice);
          handleLivesUpdate(result);
        }
      });
    }
  }, [gameId, gameFinished]);

  // Update nyawa pemain berdasarkan hasil permainan
  const handleLivesUpdate = (result) => {
    if (result === "Player 1 wins") {
      setPlayer2Lives((prevLives) => Math.max(prevLives - 1, 0));
    } else if (result === "Player 2 wins") {
      setPlayer1Lives((prevLives) => Math.max(prevLives - 1, 0));
    }

    // Reset pilihan setelah setiap ronde
    const gameRef = ref(db, "games/" + gameId);
    update(gameRef, { "player1/choice": "", "player2/choice": "" }).then(() => {
      // Cek jika nyawa pemain habis, akhiri permainan dan tampilkan notifikasi
      if (player1Lives === 0) {
        setGameFinished(true);
        setCountdown(10);
        if (currentPlayer === "player2") {
          Swal.fire({
            icon: 'success',
            title: 'Selamat!',
            text: 'Kamu menang!',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Kamu kalah!',
          });
        }
      } else if (player2Lives === 0) {
        setGameFinished(true);
        setCountdown(10);
        if (currentPlayer === "player1") {
          Swal.fire({
            icon: 'success',
            title: 'Selamat!',
            text: 'Kamu menang!',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Kamu kalah!',
          });
        }
      } else {
        setHasChosen(false); // Reset pilihan untuk ronde berikutnya
      }
    });
  };

  // Hapus game dari database setelah permainan selesai
  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        alert("Permainan selesai dan game telah dihapus.");
        setGameId("");
        setHasChosen(false);
        setGameFinished(false);
        setPlayer1Lives(3); // Reset nyawa pemain
        setPlayer2Lives(3); // Reset nyawa pemain
      })
      .catch((error) => {
        console.error("Gagal menghapus game: ", error);
      });
  };

  // Countdown dan delay
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

  // Tentukan pemenang
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

  // Menampilkan pesan kemenangan menggunakan Swal
  useEffect(() => {
    if (gameFinished && gameData) {
      const winner = determineWinner(gameData.player1.choice, gameData.player2.choice);
      if (winner === "Player 1 wins") {
        Swal.fire({
          icon: 'success',
          title: 'Selamat!',
          text: 'Pemain 1 menang!',
        });
        if (currentPlayer === "player2") {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Kamu kalah!',
          });
        }
      } else if (winner === "Player 2 wins") {
        Swal.fire({
          icon: 'success',
          title: 'Selamat!',
          text: 'Pemain 2 menang!',
        });
        if (currentPlayer === "player1") {
          Swal.fire({
            icon: 'error',
            title: 'Maaf!',
            text: 'Kamu kalah!',
          });
        }
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Hasil',
          text: 'Permainan berakhir dengan hasil seri!',
        });
      }
    }
  }, [gameFinished, gameData, currentPlayer]);

  return (
    <div className="game-container">
      <h1>Gunting Kertas Batu Multiplayer</h1>
      {!gameId && (
        <>
          <button onClick={createGame}>Buat Game</button>
          <input
            type="text"
            placeholder="Masukkan Game ID"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
          />
          <button onClick={joinGame}>Bergabung ke Game</button>
        </>
      )}
      {gameData && (
        <>
          <div>GameId: {gameId}</div>
          <p>Nyawa Pemain 1: {player1Lives}</p>
          <p>Nyawa Pemain 2: {player2Lives}</p>
          {!gameFinished ? (
            <div className="choices">
              <button onClick={() => handleChoice("rock")} disabled={hasChosen}>
                🪨 Batu
              </button>
              <button
                onClick={() => handleChoice("paper")}
                disabled={hasChosen}
              >
                📄 Kertas
              </button>
              <button
                onClick={() => handleChoice("scissors")}
                disabled={hasChosen}
              >
                ✂️ Gunting
              </button>
            </div>
          ) : (
            <p>Permainan selesai. Menghapus game dalam {countdown} detik...</p>
          )}
          <p>
            Pemain 1: {gameData.player1.choice || "Belum memilih"}
          </p>
          <p>
            Pemain 2: {gameData.player2.choice || "Belum memilih"}
          </p>
          {gameData.player1.choice && gameData.player2.choice && (
            <>
              <p>
                Hasil:{" "}
                {determineWinner(
                  gameData.player1.choice,
                  gameData.player2.choice
                )}
              </p>
              {gameFinished && countdown > 0 && <p>Countdown: {countdown}</p>}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RockPaperScissorsMultiplayer;