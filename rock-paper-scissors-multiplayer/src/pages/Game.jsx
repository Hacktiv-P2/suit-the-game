import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  off,
} from "firebase/database";
import Swal from "sweetalert2";
import "../../src/ButtonRPS.css"

const Game = () => {
  const { gameId } = useParams(); // Mengambil gameId dari params
  const navigate = useNavigate(); // Untuk navigasi setelah game berakhir
  const db = getDatabase(); // Mengakses Realtime Database Firebase
  const [gameData, setGameData] = useState(null);
  const [player, setPlayer] = useState(null); // player1 atau player2
  const [isReady, setIsReady] = useState(false);
  const [p1Lives, setP1Lives] = useState(3);
  const [p2Lives, setP2Lives] = useState(3);
  const [countdown, setCountdown] = useState(10); // countdown 10 detik
  const [selectedChoice, setSelectedChoice] = useState(null); // Pilihan yang dipilih oleh pemain
  const [player1Emote, setPlayer1Emote] = useState(null); // Emote untuk player 1
  const [player2Emote, setPlayer2Emote] = useState(null); // Emote untuk player 2
  const playerName = localStorage.getItem("suit_username");
  const rockAudioRef = useRef(null);
  const paperAudioRef = useRef(null);
  const scissorsAudioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const winAudioRef = useRef(null); // Tambahkan referensi audio untuk menang
  const loseAudioRef = useRef(null); // Tambahkan referensi audio untuk kalah

  // Ikon hati berdasarkan nyawa
  const player1Icons = Array(p1Lives).fill("❤️"); // Menggunakan icon hati
  const player2Icons = Array(p2Lives).fill("❤️"); // Menggunakan icon hati

  useEffect(() => {
    rockAudioRef.current = new Audio('/assets/batu.mp3');
    paperAudioRef.current = new Audio('/assets/kertas.mp3');
    scissorsAudioRef.current = new Audio('/assets/gunting.mp3');
    winAudioRef.current = new Audio("/assets/win.mp3")
    loseAudioRef.current = new Audio("/assets/Lose.mp3")
    clickAudioRef.current = new Audio("/assets/click.mp3")
  }, []);

  useEffect(() => {
    // Mendapatkan data dari Firebase berdasarkan gameId
    const gameRef = ref(db, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        if (data.player1.emote) {
          setPlayer1Emote(data.player1.emote);
        }
        if (data.player2.emote) {
          setPlayer2Emote(data.player2.emote);
        }
        console.log("Game data updated:", data);
        setP1Lives(data.player1.lives);
        setP2Lives(data.player2.lives);

        // Jika data sudah ada dan player belum diatur, tentukan player1 atau player2
        if (!player) {
          if (data.player1.name === playerName) {
            setPlayer("player1");
            setIsReady(data.player1.ready ? true : false);
          } else if (data.player2.name === playerName) {
            setPlayer("player2");
            setIsReady(data.player2.ready ? true : false);
          } else if (!data.player1.name) {
            setPlayer("player1");
            setIsReady(data.player1.ready ? true : false);
            set(ref(db, `games/${gameId}/player1`), {
              name: playerName,
              choice: "",
              lives: 3,
            });
          } else if (!data.player2.name) {
            setPlayer("player2");
            set(ref(db, `games/${gameId}/player2`), {
              name: playerName,
              choice: "",
              lives: 3,
            });
          }
        }
      }
    });
  }, [gameId, player]);

  const handleReady = () => {
    // Mengatur status ready ketika player siap
    update(ref(db, `games/${gameId}/${player}`), { ready: true });
    setIsReady(true);
    clickAudioRef.current.play(); // Tambahkan suara ketika tombol ready diklik
  };

  useEffect(() => {
    if (gameData?.player1?.ready && gameData?.player2?.ready) {
      update(ref(db, `games/${gameId}`), { status: "ready" });
      console.log("Game is ready!");
    }
  }, [gameData?.player1?.ready, gameData?.player2?.ready]);

  const handleChoice = (selectedChoice) => {
    setSelectedChoice(selectedChoice);
    update(ref(db, `games/${gameId}/${player}`), { choice: selectedChoice });
    console.log(`${player} has chosen: ${selectedChoice}`);
    // conditional add sfx
    if (selectedChoice === "rock") {
      rockAudioRef.current.play();
    } else if (selectedChoice === "paper") {
      paperAudioRef.current.play();
    } else if (selectedChoice === "scissors") {
      scissorsAudioRef.current.play();
    }
  };

  useEffect(() => {
    if (gameData?.status === "ready" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setTimeout(() => {
        determineWinner();
      }, 1000);
    }
  }, [gameData?.status, countdown]);

  const determineWinner = () => {
    const { player1, player2 } = gameData;

    if (!player1.choice && !player2.choice) {
      // Jika kedua pemain tidak memilih
      console.log(
        "Both players did not make a choice. It's a draw this round!"
      );
    } else if (!player1.choice) {
      // Jika hanya player1 yang tidak memilih
      console.log("Player1 did not make a choice. Player2 wins this round!");
      update(ref(db, `games/${gameId}/player1`), { lives: player1.lives - 1 });
    } else if (!player2.choice) {
      // Jika hanya player2 yang tidak memilih
      console.log("Player2 did not make a choice. Player1 wins this round!");
      update(ref(db, `games/${gameId}/player2`), { lives: player2.lives - 1 });
    } else {
      // Jika kedua pemain memilih
      if (player1.choice === player2.choice) {
        console.log("It's a draw!");
      } else if (
        (player1.choice === "rock" && player2.choice === "scissors") ||
        (player1.choice === "scissors" && player2.choice === "paper") ||
        (player1.choice === "paper" && player2.choice === "rock")
      ) {
        console.log("Player1 wins!");
        update(ref(db, `games/${gameId}/player2`), {
          lives: player2.lives - 1,
        });
      } else {
        console.log("Player2 wins!");
        update(ref(db, `games/${gameId}/player1`), {
          lives: player1.lives - 1,
        });
      }
    }

    // Reset pilihan (choice) kedua pemain untuk ronde baru
    update(ref(db, `games/${gameId}/player1`), { choice: "" });
    update(ref(db, `games/${gameId}/player2`), { choice: "" });

    // Set countdown untuk ronde baru
    setCountdown(10); // Ubah waktu tunggu menjadi 10 detik
  };

  useEffect(() => {
    if (p1Lives === 0 || p2Lives === 0) {
      endGame();
      setTimeout(() => {
        navigate("/rooms");
      }, 2000);
    }
  }, [p2Lives, p1Lives]);

  const endGame = () => {
    const winner = gameData.player1.lives === 0 ? "Player2" : "Player1";
    update(ref(db, `games/${gameId}`), {
      gameOver: {
        winner: winner,
        loser: winner === "Player1" ? "Player2" : "Player1",
      },
    });

    setTimeout(() => {
      remove(ref(db, `games/${gameId}`));
    }, 2000);
    navigate("/rooms");
  };

  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();

      if (data.gameOver) {
        const currentPlayer = player === "player1" ? "Player1" : "Player2";
        const isWinner = data.gameOver.winner === currentPlayer;
        isWinner ? winAudioRef.current.play() : loseAudioRef.current.play();

        Swal.fire({
          title: isWinner ? "Kamu Menang!" : "Cupu!",
          imageUrl: isWinner ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUGTFp8MOe4Q3t8-pKo2nrdGXdq--f3nJLNA&s" : "https://banner2.cleanpng.com/20180325/ite/kisspng-moron-imageboard-5channel-lurkmore-computer-softwa-dishonoured-5ab8558b31a637.5079975515220299632034.jpg", 
          text: "Permainan akan berakhir dalam 5 detik...",
          imageWidth: 100,
          imageHeight: 100,
          timer: 5000,
        });
      }
    });

    return () => {
      off(gameRef);
    };
  }, [gameId, player]);

  const sendEmote = (emote) => {
    const gameRef = ref(db, `games/${gameId}`);
    if (player === "player1") {
      setPlayer2Emote(emote);
      update(gameRef, { "player2/emote": emote });
    } else if (player === "player2") {
      setPlayer1Emote(emote);
      update(gameRef, { "player1/emote": emote });
    }
  };

  return (
    <div className="bg-color3 min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-2">Suit - The Game</h1>
      <h2 className="text-xl font-bold mb-3">GameId: {gameId}</h2>
      {player && (
        <h2 className="text-2xl mb-4">
          You are <span className="font-bold">{player}</span>
        </h2>
      )}

      {gameData && (
        <div className="flex space-x-8 mb-8 text-center">
          {player === "player1" && (
            <div className="bg-color4 p-4 rounded-lg w-64 text-color2 truncate">
              <h3 className="text-xl font-bold">Player 1</h3>
              <p className="text-lg">
                Name: {gameData.player1.name ? gameData.player1.name : "-"}
              </p>
              <p className="text-lg">Lives: {player1Icons.join(" ")}</p>
              <p className="text-lg">Provokasi : <br />
              {player1Emote ? player1Emote : "-"}</p>
            </div>
          )}
          {player === "player2" && (
            <div className="bg-color4 p-4 rounded-lg w-64 text-color2 truncate">
              <h3 className="text-xl font-bold">Player 2</h3>
              <p className="text-lg">
                Name: {gameData.player2.name ? gameData.player2.name : "-"}
              </p>
              <p className="text-lg">Lives: {player2Icons.join(" ")}</p>
              <p className="text-lg">Provokasi: <br />
              {player2Emote ? player2Emote : "-"}</p>
            </div>
          )}
        </div>
      )}

      {!isReady && (
        <button
          onClick={handleReady}
          className="bg-color1 hover:bg-color1/80 text-color2 font-bold py-2 px-4 rounded mb-4"
        >
          Ready
        </button>
      )}

      {gameData?.status === "ready" && (
        <h3 className="text-3xl mb-4">Countdown: {countdown}</h3>
      )}

      {gameData?.status === "ready" && countdown > 0 && (
        <div className="flex flex-row space-x-4">
          <button
            onClick={() => handleChoice("rock")}
            className={`${
              selectedChoice === "rock" ? "bg-blue-500" : "bg-color1"
            } hover:bg-color1/80 text-white gap-3 font-bold py-2 px-4 rounded`}
          >
            <img
              src="https://img.icons8.com/?size=100&id=37630&format=png&color=000000"
              alt="rock"
            />
            Rock
          </button>
          <button
            onClick={() => handleChoice("paper")}
            className={`${
              selectedChoice === "paper" ? "bg-blue-500" : "bg-color1"
            } hover:bg-color1/80 text-white font-bold py-2 px-4 rounded`}
          >
            <img
              src="https://img.icons8.com/?size=100&id=77781&format=png&color=000000"
              alt="paper"
            />
            Paper
          </button>
          <button
            onClick={() => handleChoice("scissors")}
            className={`${
              selectedChoice === "scissors" ? "bg-blue-500" : "bg-color1"
            } hover:bg-color1/80 text-white font-bold py-2 px-4 rounded`}
          >
            <img
              src="https://img.icons8.com/?size=100&id=38895&format=png&color=000000"
              alt="scissors"
            />
            Scissors
          </button>
        </div>
      )}

      <div className="emote-container">
        <p className="text-black">emote here:</p>
        <select onChange={(e) => sendEmote(e.target.value, player === "player1" ? "player2" : "player1")} className="text-black">
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
        <p className="text-black">input text </p>
        <input type="text" onChange={(e) => sendEmote(e.target.value, player === "player1" ? "player2" : "player1")} placeholder="Ketik roastinganmu!" className="text-black" />
      </div>
    </div>
  );
}


export default Game;
