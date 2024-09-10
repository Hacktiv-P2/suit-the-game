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

  // Refs for audio elements
  const rockAudioRef = useRef(null);
  const paperAudioRef = useRef(null);
  const scissorsAudioRef = useRef(null);
  const joinGameAudioRef = useRef(null);
  const muatGameAudioRef = useRef(null);

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
      muatGameAudioRef.current.play(); // Mainkan suara ketika game dimuat
      joinGameAudioRef.current.play()
      
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
        toast.error("Game tidak tersedia atau sudah dimulai");
      }
    } catch (error) {
      console.error("Error joining game: ", error);
      toast.error("Terjadi kesalahan saat bergabung ke game");
    }
  };

  // Pantau data game dari Firebase
  useEffect(() => {
    if (gameId) {
      const gameRef = ref(db, "games/" + gameId);
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        setGameData(data);

        // Perbarui nyawa pemain di state jika perlu
        if (data?.player1?.lives !== player1Lives || data?.player2?.lives !== player2Lives) {
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
          const result = determineWinner(data.player1.choice, data.player2.choice);
          handleLivesUpdate(result);
        }
      });
    }
  }, [gameId, gameFinished, player1Lives, player2Lives]);

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
      "player2/choice": ""
    }).then(() => {
      setPlayer1Lives(newPlayer1Lives);
      setPlayer2Lives(newPlayer2Lives);
      
      // Cek jika nyawa pemain habis, akhiri permainan dan tampilkan notifikasi
      if (newPlayer1Lives === 0 || newPlayer2Lives === 0) {
        setGameFinished(true);
        setCountdown(5); // Ubah countdown menjadi 5 detik
        if (newPlayer1Lives === 0) {
          Swal.fire({
            title: 'Cupu!',
            imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
             imageWidth: 100,
             imageHeight: 100,
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              title: 'Cupu!',
              imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
               imageWidth: 100,
               imageHeight: 100,
            });
          } else if (currentPlayer === "player2") {
            Swal.fire({
              title: 'Selamat!',
              imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUGTFp8MOe4Q3t8-pKo2nrdGXdq--f3nJLNA&s',
              imageWidth: 100,
              imageHeight: 100,
            });
          }
        } else if (newPlayer2Lives === 0) {
          Swal.fire({
            title: 'Cupu!',
            imageUrl: 'https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg',
             imageWidth: 100,
             imageHeight: 100,
          });
          if (currentPlayer === "player1") {
            Swal.fire({
              title: 'Selamat!',
              imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUGTFp8MOe4Q3t8-pKo2nrdGXdq--f3nJLNA&s',
              imageWidth: 100,
              imageHeight: 100,
            });
          } else if (currentPlayer === "player2") {
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
      }
    });
  };

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
    <div className="game-container block shadow-lg" style={{ padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#2A2D34', maxWidth: '600px', margin: 'auto' }}>
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
              <div>GameId: {gameId}</div>
              <br />
              <p style={{ fontFamily: 'Arial, sans-serif' }}>Nyawa Pemain 1: {player1Icons.map((icon, index) => <span key={index}>{icon}</span>)}</p>
              <p style={{ fontFamily: 'Arial, sans-serif' }}>Nyawa Pemain 2: {player2Icons.map((icon, index) => <span key={index}>{icon}</span>)}</p>
              <br />
            </>
          )}
          {!gameFinished ? (
            <div className="choices" style={{ fontFamily: 'Comic Sans MS, sans-serif' }}>
              <button onClick={() => handleChoice("rock")} disabled={hasChosen} className="burning-button">
                🪨 Batu
                {gameData[currentPlayer].choice === "rock" && <span> ✔️</span>}
              </button>
              <button
                onClick={() => handleChoice("paper")}
                disabled={hasChosen}
                className="burning-button"
              >
                📄 Kertas
                {gameData[currentPlayer].choice === "paper" && <span> ✔️</span>}
              </button>
              <button
                onClick={() => handleChoice("scissors")}
                disabled={hasChosen}
                className="burning-button"
              >
                ✂️ Gunting
                {gameData[currentPlayer].choice === "scissors" && <span> ✔️</span>}
              </button>
            </div>
          ) : (
            <p style={{ fontFamily: 'Arial, sans-serif' }}>Permainan selesai. Menghapus game dalam {countdown} detik...</p>
          )}
          {!gameFinished && (
            <>
              <p style={{ fontFamily: 'Arial, sans-serif' }}>
                <br />
                Pemain 1: {gameData.player1.choice ? "Sudah memilih" : "Belum memilih"}
              </p>
              <p style={{ fontFamily: 'Arial, sans-serif' }}>
                Pemain 2: {gameData.player2.choice ? "sudah memilih" : "Belum memilih"}
              </p>
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
}
  
  

export default RockPaperScissorsMultiplayer;
