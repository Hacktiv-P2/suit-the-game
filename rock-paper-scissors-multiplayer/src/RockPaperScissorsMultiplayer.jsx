import React, { useState, useEffect, useRef } from "react";
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "./firebase";
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../src/ButtonRPS.css'
import '../src/ButtonBuatGame.css'

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
  const [player1Emote, setPlayer1Emote] = useState(""); // State untuk emote pemain 1
  const [player2Emote, setPlayer2Emote] = useState(""); // State untuk emote pemain 2
  // const [showEmote, setShowEmote] = useState(false); // Tambahkan state untuk mengontrol visibilitas emote

  // Refs for audio elements
  const rockAudioRef = useRef(null);
  const paperAudioRef = useRef(null);
  const scissorsAudioRef = useRef(null);
  const joinGameAudioRef = useRef(null);
  const muatGameAudioRef = useRef(null);
  const winAudioRef = useRef(new Audio("/assets/win.mp3")); // Tambahkan referensi audio untuk menang
  const loseAudioRef = useRef(new Audio("/assets/Lose.mp3")); // Tambahkan referensi audio untuk kalah

  // Fungsi untuk memainkan suara berdasarkan pilihan
  const playSound = (choice) => {
    if (choice === "rock") {
      rockAudioRef.current.play();
    } else if (choice === "paper") {
      paperAudioRef.current.play();
    } else if (choice === "scissors") {
      scissorsAudioRef.current.play();
    } else if (choice === "joingame") {
      joinGameAudioRef.current.play();
    } else if (choice === "muatgame") {
      muatGameAudioRef.current.play();
    }
  };

  // Pemain membuat pilihan
  const handleChoice = (choice) => {
    const gameRef = ref(db, "games/" + gameId);
    if (!hasChosen && !gameFinished) {
      playSound(choice); // Mainkan suara ketika pilihan dibuat
      if (currentPlayer === "player1") {
        update(gameRef, { "player1/choice": choice });
      } else if (currentPlayer === "player2") {
        update(gameRef, { "player2/choice": choice });
      }
      setHasChosen(true); 
    }
  };

  // Fungsi untuk mengirim emote
  const sendEmote = (emote) => {
    const gameRef = ref(db, "games/" + gameId);
    if (currentPlayer === "player1") {
      setPlayer1Emote(emote);
      update(gameRef, { "player1/emote": emote });
    } else if (currentPlayer === "player2") {
      setPlayer2Emote(emote);
      update(gameRef, { "player2/emote": emote });
    }
    // setShowEmote(true); // Tampilkan emote
    // setTimeout(() => setShowEmote(false), 1000); // Sembunyikan setelah 1 detik
  };

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
      muatGameAudioRef.current.play(); // Mainkan suara ketika game dimuat
      joinGameAudioRef.current.play()
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


  // Fungsi untuk memilih secara acak
  const getRandomChoice = () => {
    const choices = ["rock", "paper", "scissors"];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  // Handle timeout jika pemain tidak membuat pilihan
  const handleTimeout = async () => {
    setTimerActive(false);
    setHasChosen(true); // Mencegah pemain membuat pilihan lebih lanjut
    const gameRef = ref(db, "games/" + gameId);

    // Pilih acak untuk pemain yang belum memilih
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

    // Ubah status game jika perlu
    update(gameRef, { status: "timeout" });
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

        setPlayer1Emote(data?.player1?.emote || ""); // Update emote pemain 1
        setPlayer2Emote(data?.player2?.emote || ""); // Update emote pemain 2
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
          loseAudioRef.current.play(); // Mainkan suara kalah
          Swal.fire({
            title: 'Cupu!',
            imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
             imageWidth: 100,
             imageHeight: 100,
          });
          if (currentPlayer === "player1") {
            loseAudioRef.current.play()
            Swal.fire({
              title: 'Cupu!',
              imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
               imageWidth: 100,
               imageHeight: 100,
            });
          } else if (currentPlayer === "player2") {
            winAudioRef.current.play()
            Swal.fire({
              title: 'Selamat!',
              imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUGTFp8MOe4Q3t8-pKo2nrdGXdq--f3nJLNA&s',
              imageWidth: 100,
              imageHeight: 100,
            });
          }
        } else if (newPlayer2Lives === 0) {
          loseAudioRef.current.play(); // Mainkan suara menang
          Swal.fire({
            title: 'Cupu!',
            imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
             imageWidth: 100,
             imageHeight: 100,
          });
          if (currentPlayer === "player1") {
            winAudioRef.current.play()
            Swal.fire({
              title: 'Selamat!',
              imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUGTFp8MOe4Q3t8-pKo2nrdGXdq--f3nJLNA&s',
              imageWidth: 100,
              imageHeight: 100,
            });
          } else if (currentPlayer === "player2") {
            loseAudioRef.current.play()
            Swal.fire({
              title: 'Cupu!',
              imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
               imageWidth: 100,
               imageHeight: 100,
            });
          }
        }
      } else {
        setHasChosen(false); // Reset pilihan untuk ronde berikutnya
        setChoiceTimer(5); // Reset timer untuk ronde berikutnya
      }
    });
  };

  const [selectionCountdown, setSelectionCountdown] = useState(10); // Timer pemilihan
  const [timerActive, setTimerActive] = useState(false); // Apakah timer aktif

  useEffect(() => {
    if (gameData && gameData.status === "ready" && !gameFinished) {
      if (!timerActive) {
        setTimerActive(true);
        setSelectionCountdown(10); // Set timer 10 detik
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
      // Waktu habis, handle timeout
      handleTimeout();
    }
    return () => clearTimeout(timer); // Bersihkan timeout saat komponen di-unmount
  }, [selectionCountdown, timerActive]);

  // Hapus game dari database setelah permainan selesai
  const deleteGame = () => {
    const gameRef = ref(db, "games/" + gameId);
    remove(gameRef)
      .then(() => {
        toast.success("Permainan selesai , main lagi yuk :).");
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
            text: 'Males Ahh Main Janken Aja Kalahan... :(!',
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
            text: 'Males Ahh Main Janken Aja Kalahan... :(!',
          });
        }
      }
    }
  }, [gameFinished, gameData, currentPlayer]);
  
  const player1Icons = Array(player1Lives).fill("❤️"); // Menggunakan icon hati
  const player2Icons = Array(player2Lives).fill("❤️"); // Menggunakan icon hati
  return (
    <div className="game-container block shadow-lg" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#2A2D34', maxWidth: '600px', margin: 'auto', zoom: '90%' }}>
    <h1 style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', color: '#F7F7F7' }}>Multiplayer Showdown: Gunting Kertas Batu</h1>
    <br />
      {!gameId && (
        <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <button
            onClick={createGame}
            className="buatGame-btn"
            style={{ marginBottom: '10px' }}
          >
            Buat Game
          </button> 
          <input
            type="text"
            placeholder="Masukkan Game ID"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            style={{ display: 'block', marginBottom: '10px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }}
          />
        </div>
        <button
          onClick={joinGame}
          className="joinGame-btn"
        >
          Bergabung ke Game
        </button>
      </>
             )}
     {gameData && (
  <>
    {!gameFinished && (
      <>
        {/* indikator player */}
        <div
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#f0f0f0",
            color: "black",
          }}
        >
          {currentPlayer} {gameData[currentPlayer].choice}
        </div>
        <br />
        <div>GameId: {gameId}</div>
        <br />
        {currentPlayer === "player1" && (
          <p style={{ fontFamily: "Arial, sans-serif" }}>
            Nyawa Anda: {player1Icons.map((icon, index) => (
              <span key={index}>{icon}</span>
            ))}
          </p>
        )}
        {currentPlayer === "player2" && (
          <p style={{ fontFamily: "Arial, sans-serif" }}>
            Nyawa Anda: {player2Icons.map((icon, index) => (
              <span key={index}>{icon}</span>
            ))}
          </p>
        )}
        <br />
        <div>
          {currentPlayer === "player1" && <p> Provocation {'=>'} {player2Emote}</p>}
          {currentPlayer === "player2" && <p> Provocation {'=>'} {player1Emote}</p>}
        </div>
      </>
    )}
    {!gameFinished ? (
      <div className="choices" style={{ fontFamily: "Comic Sans MS, sans-serif" }}>
        <button
          onClick={() => handleChoice("rock")}
          disabled={hasChosen || selectionCountdown === 0}
          className="burning-button"
        >
          🪨 Batu
          {gameData[currentPlayer].choice === "rock" && <span> ✔️</span>}
        </button>
        <button
          onClick={() => handleChoice("paper")}
          disabled={hasChosen || selectionCountdown === 0}
          className="burning-button"
        >
          📄 Kertas
          {gameData[currentPlayer].choice === "paper" && <span> ✔️</span>}
        </button>
        <button
          onClick={() => handleChoice("scissors")}
          disabled={hasChosen || selectionCountdown === 0}
          className="burning-button"
        >
          ✂️ Gunting
          {gameData[currentPlayer].choice === "scissors" && <span> ✔️</span>}
        </button>
      </div>
    ) : (
      <p style={{ fontFamily: "Arial, sans-serif" }}>
        Permainan selesai. Menghapus game dalam {countdown} detik...
      </p>
    )}
    {!gameFinished && (
      <>
        <p style={{ fontFamily: "Arial, sans-serif" }}>
          Pemain 1: {gameData.player1.choice ? "Sudah memilih" : "Belum memilih"}
        </p>
        <p style={{ fontFamily: "Arial, sans-serif" }}>
          Pemain 2: {gameData.player2.choice ? "Sudah memilih" : "Belum memilih"}
        </p>
      </>
    )}
    <br />
    {selectionCountdown > 0 && gameData.status === "ready" && (
      <p>Waktu pemilihan tersisa: {selectionCountdown} detik</p>
    )}
    {gameFinished && (
      <p>Permainan selesai. Menghapus game dalam {countdown} detik...</p>
    )}
    <p>
      Pemain 1 memilih: {gameData.player1.choice ? "Sudah Memilih" : "Belum memilih"}
      {gameFinished && <span> (Pilihan: {gameData.player1.choice})</span>}
    </p>
    <p>
      Pemain 2 memilih: {gameData.player2.choice ? "Sudah Memilih" : "Belum memilih"}
      {gameFinished && <span> (Pilihan: {gameData.player2.choice})</span>}
    </p>

    {gameData.player1.choice && gameData.player2.choice && (
      <>
        <p>
          Hasil: {determineWinner(gameData.player1.choice, gameData.player2.choice)}
        </p>
        {gameFinished && countdown > 0}
      </>
    )}

    <div className="emote-container">
      <p>emote here:</p>
      <select onChange={(e) => sendEmote(e.target.value)}>
        <option value="">Pilih emote</option>
        <option value="✂️">Gunting</option>
        <option value="🪨">Batu</option>
        <option value="📄">Kertas</option>
        <option value="gua pilih gunting">teks: gua pilih gunting</option>
        <option value="gua pilih batu">teks: gua pilih batu</option>
        <option value="gua pilih kertas">teks: gua pilih kertas</option>
      </select>
      <br />
      <br />
      <input
        type="text"
        onChange={(e) => sendEmote(e.target.value)}
        placeholder="Ketik roastinganmu!"
      />
    </div>
  </>
)}

      <ToastContainer />
      {/* Menyematkan video YouTube tanpa tampilan */}
      <iframe 
        width="50" // Ubah lebar iframe
        height="25" // Ubah tinggi iframe
        src="https://www.youtube.com/embed/ivQfneFB13s?start=3" // Mainkan langsung di detik ke 2
        frameBorder="0" 
        allow="autoplay; encrypted-media" 
        allowFullScreen 
        title="Background Music"
        style={{ display: 'block', position: 'fixed', bottom: '10px', right: '10px', zIndex: '1000' }} // Tampilkan iframe di pojok kanan bawah layar
      />
      {/* Audio elements for rock, paper, and scissors sounds */}
      <audio ref={rockAudioRef} src="/assets/batu.mp3" />
      <audio ref={paperAudioRef} src="/assets/kertas.mp3" />
      <audio ref={scissorsAudioRef} src="/assets/gunting.mp3" />
      <audio ref={joinGameAudioRef} src="/assets/joingame.mp3" /> 
      <audio ref={muatGameAudioRef} src="/assets/muatgame.mp3" />
    </div>
  );
};

export default RockPaperScissorsMultiplayer;
