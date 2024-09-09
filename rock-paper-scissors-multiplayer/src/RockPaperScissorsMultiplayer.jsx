import React, { useState, useEffect } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "./firebase";

const RockPaperScissorsMultiplayer = () => {
  const [gameId, setGameId] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [gameData, setGameData] = useState(null);
  const [inputGameId, setInputGameId] = useState("");
  const [hasChosen, setHasChosen] = useState(false); // Untuk mencegah pemain ganti pilihan
  const [gameFinished, setGameFinished] = useState(false); // Untuk menandai permainan selesai
  const [countdown, setCountdown] = useState(0); // Untuk countdown sebelum menghapus game

  // Membuat game baru
  const createGame = () => {
    const newGameId = Date.now().toString(); // ID unik untuk game
    const gameRef = ref(db, "games/" + newGameId);
    set(gameRef, {
      player1: { choice: "" },
      player2: { choice: "" },
      status: "waiting", // Status game menunggu pemain lain
    });
    setGameId(newGameId);
    setCurrentPlayer("player1");
  };

  // Bergabung ke game
  const joinGame = async () => {
    const gameRef = ref(db, "games/" + inputGameId);
    try {
      const snapshot = await get(gameRef); // Mengambil data sekali
      const data = snapshot.val();
      if (data && data.status === "waiting") {
        setGameId(inputGameId);
        setCurrentPlayer("player2");
        // Ubah status game setelah player 2 bergabung
        await update(gameRef, { status: "ready" });
        setInputGameId("");
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
      setHasChosen(true); // Cegah pemain mengganti pilihan
    }
  };

  // Pantau data game dari Firebase
  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGameData(data);

        // Jika kedua pemain sudah memilih, tentukan pemenang
        if (data?.player1?.choice && data?.player2?.choice && !gameFinished) {
          setGameFinished(true);
          setCountdown(10); // Mulai countdown 10 detik
        }
      });
    }
  }, [gameId, gameFinished]);

  const [selectionCountdown, setSelectionCountdown] = useState(10); // Timer pemilihan
  const [timerActive, setTimerActive] = useState(false); // Apakah timer aktif

  useEffect(() => {
    if (gameData && gameData.status === "ready" && !gameFinished) {
      if (!timerActive) {
        setTimerActive(true);
        setSelectionCountdown(10); // Set timer 10 detik
      }
    }
  }, [gameData, gameFinished, timerActive]);

  useEffect(() => {
    let timer;
    if (timerActive && selectionCountdown > 0) {
      timer = setTimeout(() => {
        setSelectionCountdown(selectionCountdown - 1);
      }, 1000);
    } else if (selectionCountdown === 0) {
      // Waktu habis, handle timeout
      handleTimeout();
    }
    return () => clearTimeout(timer); // Bersihkan timeout saat komponen di-unmount
  }, [selectionCountdown, timerActive]);

  const handleTimeout = () => {
    setTimerActive(false);
    setHasChosen(true); // Mencegah pemain membuat pilihan lebih lanjut
    // Jika salah satu pemain tidak membuat pilihan, Anda bisa menangani situasi ini dengan cara sesuai
    const gameRef = ref(db, "games/" + gameId);
    // Misalnya, ubah status game jika perlu
    update(gameRef, { status: "timeout" });
  };

  // Hapus game dari database setelah permainan selesai
  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        alert("Permainan selesai dan game telah dihapus.");
        setGameId(""); // Reset state
        setHasChosen(false);
        setGameFinished(false);
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
      deleteGame(); // Hapus game setelah countdown selesai
    }
    return () => clearTimeout(timer); // Bersihkan timeout saat komponen di-unmount
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
          {!gameFinished && !timerActive && (
            <p>Menunggu pemain untuk membuat pilihan...</p>
          )}
          {!gameFinished && timerActive && (
            <div className="choices">
              <button
                onClick={() => handleChoice("rock")}
                disabled={hasChosen || selectionCountdown === 0}
              >
                🪨 Batu
              </button>
              <button
                onClick={() => handleChoice("paper")}
                disabled={hasChosen || selectionCountdown === 0}
              >
                📄 Kertas
              </button>
              <button
                onClick={() => handleChoice("scissors")}
                disabled={hasChosen || selectionCountdown === 0}
              >
                ✂️ Gunting
              </button>
            </div>
          )}
          {selectionCountdown > 0 && !hasChosen && (
            <p>Waktu pemilihan tersisa: {selectionCountdown} detik</p>
          )}
          {gameFinished && (
            <p>Permainan selesai. Menghapus game dalam {countdown} detik...</p>
          )}
          <p>
            Pemain 1 memilih:{" "}
            {gameData.player1.choice ? "Sudah Memilih" : "Belum memilih"}
          </p>
          <p>
            Pemain 2 memilih:{" "}
            {gameData.player2.choice ? "Sudah Memilih" : "Belum memilih"}
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
