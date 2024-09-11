import React, { useState, useEffect } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "./firebase";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // Timer untuk pilihan
  const [choiceTimer, setChoiceTimer] = useState(5); // 5 detik untuk memilih

  const choices = ["rock", "paper", "scissors"];

  // Fungsi untuk memilih acak
  const randomChoice = () => {
    return choices[Math.floor(Math.random() * choices.length)];
  };

  // Membuat game baru
  const createGame = () => {
    console.log("Creating a new game...");
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
      setChoiceTimer(5); // Reset timer untuk ronde baru
    });
  };

  // Bergabung ke game
  const joinGame = async () => {
    console.log("Joining game with ID:", inputGameId);
    const gameRef = ref(db, "games/" + inputGameId);
    try {
      const snapshot = await get(gameRef);
      const data = snapshot.val();
      if (data && data.status === "waiting") {
        console.log("Game is available to join.");
        setGameId(inputGameId);
        setCurrentPlayer("player2");
        await update(gameRef, { status: "ready" });
        setInputGameId("");
        setHasChosen(false);
        setChoiceTimer(5); // Reset timer untuk ronde baru
      } else {
        toast.error("Game tidak tersedia atau sudah dimulai");
      }
    } catch (error) {
      console.error("Error joining game: ", error);
      toast.error("Terjadi kesalahan saat bergabung ke game");
    }
  };

  // Pemain membuat pilihan
  const handleChoice = (choice) => {
    console.log(`Player ${currentPlayer} chooses ${choice}`);
    const gameRef = ref(db, "games/" + gameId);
    if (!hasChosen && !gameFinished) {
      if (currentPlayer === "player1") {
        update(gameRef, { "player1/choice": choice });
      } else if (currentPlayer === "player2") {
        update(gameRef, { "player2/choice": choice });
      }
      setHasChosen(true);
      setChoiceTimer(5); // Reset timer setelah memilih
    }
  };

  // Pantau data game dari Firebase
  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      console.log("Listening to game data...");
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGameData(data);

        // Perbarui nyawa pemain di state jika perlu
        if (
          data?.player1?.lives !== player1Lives ||
          data?.player2?.lives !== player2Lives
        ) {
          setPlayer1Lives(data?.player1?.lives || 3);
          setPlayer2Lives(data?.player2?.lives || 3);
        }

        // Jika salah satu pemain nyawanya sudah 0, maka game berakhir
        if (data?.player1?.lives === 0 || data?.player2?.lives === 0) {
          setGameFinished(true);
          setCountdown(5); // Ubah countdown menjadi 5 detik
        }

        // Jika kedua pemain sudah memilih, tentukan pemenang
        if (data?.player1?.choice && data?.player2?.choice && !gameFinished) {
          const result = determineWinner(
            data.player1.choice,
            data.player2.choice
          );
          handleLivesUpdate(result);
        }
      });
    }
  }, [gameId, gameFinished, player1Lives, player2Lives]);

  // Countdown untuk waktu memilih
  useEffect(() => {
    let timer;
    if (choiceTimer > 0 && !hasChosen && !gameFinished) {
      timer = setTimeout(() => {
        setChoiceTimer(choiceTimer - 1);
      }, 1000);
    } else if (choiceTimer === 0 && !hasChosen && !gameFinished) {
      handleChoice(randomChoice()); // Pilih acak jika waktu habis
    }
    return () => clearTimeout(timer);
  }, [choiceTimer, hasChosen, gameFinished]);

  // Update nyawa pemain berdasarkan hasil permainan
  const handleLivesUpdate = (result) => {
    let newPlayer1Lives = player1Lives;
    let newPlayer2Lives = player2Lives;

    if (result === "Player 1 wins") {
      newPlayer2Lives = Math.max(player2Lives - 1, 0);
    } else if (result === "Player 2 wins") {
      newPlayer1Lives = Math.max(player1Lives - 1, 0);
    }

    // Update nyawa pemain di state dan Firebase
    const gameRef = ref(db, "games/" + gameId);
    update(gameRef, {
      "player1/lives": newPlayer1Lives,
      "player2/lives": newPlayer2Lives,
      "player1/choice": "",
      "player2/choice": "",
    }).then(() => {
      setPlayer1Lives(newPlayer1Lives);
      setPlayer2Lives(newPlayer2Lives);

      // Cek jika nyawa pemain habis, akhiri permainan dan tampilkan notifikasi
      if (newPlayer1Lives === 0 || newPlayer2Lives === 0) {
        setGameFinished(true);
        setCountdown(5); // Ubah countdown menjadi 5 detik
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
        setHasChosen(false); // Reset pilihan untuk ronde berikutnya
        setChoiceTimer(5); // Reset timer untuk ronde berikutnya
      }
    });
  };

  // Hapus game dari database setelah permainan selesai
  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        toast.success("Permainan selesai dan game telah dihapus.");
        setGameId("");
        setHasChosen(false);
        setGameFinished(false);
        // Reset nyawa di sini
      })
      .catch((error) => {
        console.error("Gagal menghapus game: ", error);
      });
  };

  // Countdown dan delay
  // useEffect(() => {
  //   let timer;
  //   if (countdown > 0) {
  //     timer = setTimeout(() => {
  //       setCountdown(countdown - 1);
  //     }, 1000);
  //   } else if (countdown === 0 && gameFinished) {
  //     deleteGame();
  //   }
  //   return () => clearTimeout(timer);
  // }, [countdown, gameFinished]);

  // Countdown dan delay, hanya mulai jika kedua pemain sudah join (status "ready")

  useEffect(() => {
    let timer;
    // Cek apakah kedua pemain sudah join (status "ready")
    if (gameData?.status === "ready" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    // Jika countdown habis dan game selesai, hapus game
    if (countdown === 0 && gameFinished) {
      deleteGame();
    }
    return () => clearTimeout(timer); // Bersihkan timer saat komponen unmount atau countdown berubah
  }, [countdown, gameFinished, gameData?.status]);

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
          {!gameFinished && (
            <>
              <div>GameId: {gameId}</div>
              <p>Nyawa Pemain 1: {player1Lives}</p>
              <p>Nyawa Pemain 2: {player2Lives}</p>
            </>
          )}
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
          {!gameFinished && (
            <>
              <p>
                Pemain 1:{" "}
                {gameData.player1.choice ? "sudah memilih" : "Belum memilih"}
              </p>
              <p>
                Pemain 2:{" "}
                {gameData.player2.choice ? "sudah memilih" : "Belum memilih"}
              </p>
              <p>Sisa waktu untuk memilih: {choiceTimer} detik</p>{" "}
              {/* Tambahkan countdown */}
            </>
          )}
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
      <ToastContainer />
    </div>
  );
};

export default RockPaperScissorsMultiplayer;
