import { useEffect, useState } from "react";
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

const Game = () => {
  const { gameId } = useParams(); // Mengambil gameId dari params
  const navigate = useNavigate(); // Untuk navigasi setelah game berakhir
  const db = getDatabase(); // Mengakses Realtime Database Firebase
  const [gameData, setGameData] = useState(null);
  const [player, setPlayer] = useState(null); // player1 atau player2
  const [isReady, setIsReady] = useState(false);
  const [p1Lives, setP1Lives] = useState(3);
  const [p2Lives, setP2Lives] = useState(3);
  const [countdown, setCountdown] = useState(5); // countdown 10 detik
  const playerName = localStorage.getItem("suit_username");

  useEffect(() => {
    // Mendapatkan data dari Firebase berdasarkan gameId
    const gameRef = ref(db, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
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
  };

  useEffect(() => {
    if (gameData?.player1?.ready && gameData?.player2?.ready) {
      update(ref(db, `games/${gameId}`), { status: "ready" });
      console.log("Game is ready!");
    }
  }, [gameData?.player1?.ready, gameData?.player2?.ready]);

  const handleChoice = (selectedChoice) => {
    update(ref(db, `games/${gameId}/${player}`), { choice: selectedChoice });
    console.log(`${player} has chosen: ${selectedChoice}`);
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
    setCountdown(5);
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

        Swal.fire({
          title: isWinner ? "You won!" : "You lost!",
          text: "The game will end in 5 seconds...",
          icon: isWinner ? "success" : "error",
          timer: 5000,
        });
      }
    });

    return () => {
      off(gameRef);
    };
  }, [gameId, player]);

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
          <div className="bg-color4 p-4 rounded-lg w-64 text-color2 truncate">
            <h3 className="text-xl font-bold">Player 1</h3>
            <p className="text-lg">
              Name: {gameData.player1.name ? gameData.player1.name : "-"}
            </p>
            <p className="text-lg">Lives: {gameData.player1.lives}</p>
          </div>
          <div className="bg-color4 p-4 rounded-lg w-64 text-color2 truncate">
            <h3 className="text-xl font-bold">Player 2</h3>
            <p className="text-lg">
              Name: {gameData.player2.name ? gameData.player2.name : "-"}
            </p>
            <p className="text-lg">Lives: {gameData.player2.lives}</p>
          </div>
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
        <div className="flex space-x-4">
          <button
            onClick={() => handleChoice("rock")}
            className="bg-color1 hover:bg-color1/80 text-white font-bold py-2 px-4 rounded"
          >
            <img
              src="https://img.icons8.com/?size=100&id=37630&format=png&color=000000"
              alt="rock"
            />
            Rock
          </button>
          <button
            onClick={() => handleChoice("paper")}
            className="bg-color1 hover:bg-color1/80 text-white font-bold py-2 px-4 rounded"
          >
            <img
              src="https://img.icons8.com/?size=100&id=77781&format=png&color=000000"
              alt="paper"
            />
            Paper
          </button>
          <button
            onClick={() => handleChoice("scissors")}
            className="bg-color1 hover:bg-color1/80 text-white font-bold py-2 px-4 rounded"
          >
            <img
              src="https://img.icons8.com/?size=100&id=38895&format=png&color=000000"
              alt="scissors"
            />
            Scissors
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
