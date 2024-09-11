import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, remove, set, get } from "firebase/database"; // Import get untuk validasi gameId
import Swal from "sweetalert2"; // Import SweetAlert2

const Rooms = () => {
  const [gameRooms, setGameRooms] = useState({});
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [gameIdInput, setGameIdInput] = useState(""); // State untuk input gameId
  const navigate = useNavigate();

  const fetchGameRooms = () => {
    const gameRoomsRef = ref(db, "games/");
    onValue(gameRoomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameRooms(data);
      } else {
        setGameRooms({});
      }
    });
  };

  const createGameRoom = () => {
    const roomId = Date.now().toString();
    const newRoomRef = ref(db, `games/${roomId}`);
    const roomData = {
      player1: { choice: "", lives: 3, name: "" },
      player2: { choice: "", lives: 3, name: "" },
      status: "waiting",
      password: "a",
    };

    set(newRoomRef, roomData)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "New room created!",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchGameRooms();
      })
      .catch((error) => {
        console.error("Error creating room: ", error);
        Swal.fire({
          icon: "error",
          title: "Failed to create room",
        });
      });
    navigate(`/game/${roomId}`);
  };

  const handleDeleteRoom = (roomId) => {
    const roomRef = ref(db, `games/${roomId}`);
    const roomPassword = gameRooms[roomId]?.password;

    if (passwordInput === roomPassword) {
      remove(roomRef)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: `Room ${roomId} deleted successfully!`,
            showConfirmButton: false,
            timer: 1500,
          });
          fetchGameRooms();
          setPasswordInput("");
          setSelectedRoomId(null);
        })
        .catch((error) => {
          console.error("Error deleting room: ", error);
          Swal.fire({
            icon: "error",
            title: "Error deleting room",
          });
        });
    } else {
      Swal.fire({
        icon: "error",
        title: "Incorrect password",
        text: "Room deletion failed.",
      });
    }
  };

  const handleEnterGame = (roomId) => {
    navigate(`/game/${roomId}`);
  };

  // Handler untuk gabung ke game menggunakan gameId
  const handleJoinGameById = () => {
    const gameRef = ref(db, `games/${gameIdInput}`);
    if (!gameIdInput) {
      Swal.fire({
        icon: "warning",
        title: "Room Not Found!",
        text: "Room Tidak ditemukan.",
      });
    } else {
      get(gameRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            navigate(`/game/${gameIdInput}`);
          } else {
            Swal.fire({
              icon: "error",
              title: "Game ID not found",
              text: "Please check the Game ID and try again.",
            });
          }
        })
        .catch((error) => {
          console.error("Error joining game: ", error);
          Swal.fire({
            icon: "error",
            title: "Failed to join game",
          });
        });
    }
  };

  useEffect(() => {
    fetchGameRooms();
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <button
        onClick={fetchGameRooms}
        className="mb-4 bg-color2 text-white px-4 py-2 rounded hover:bg-color2/80"
      >
        Refresh Game Rooms
      </button>

      <button
        onClick={createGameRoom}
        className="mb-4 bg-color1 text-color2 px-4 py-2 rounded hover:bg-color1/80"
      >
        Create New Game Room
      </button>

      {/* Input dan tombol untuk gabung ke game dengan gameId */}
      <div className="flex flex-col items-center mb-6">
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameIdInput}
          onChange={(e) => setGameIdInput(e.target.value)}
          className="p-2 border rounded w-full mb-2"
        />
        <button
          onClick={handleJoinGameById}
          className="bg-color1 text-color2 px-4 py-2 rounded hover:bg-color1/80"
        >
          Join Game by ID
        </button>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-6">
        {!gameRooms || Object.keys(gameRooms).length === 0 ? (
          <div className="bg-color3 text-white px-2 py-1 rounded text-center">
            No Rooms Found
          </div>
        ) : (
          Object.keys(gameRooms).map((roomId) => (
            <div
              key={roomId}
              className="bg-color1 text-color2 p-4 rounded-lg shadow-md w-80 dark:bg-[#095f94] dark:text-[#dbdaa7]"
            >
              <h2 className="text-lg font-bold mb-2">Room ID: {roomId}</h2>
              <div className="mb-4">
                <div className="bg-color4 p-2 rounded-lg mb-2">
                  <p className="text-color2">
                    Player 1 Name: {gameRooms[roomId]?.player1?.name || "-"}
                  </p>
                  <p className="text-color2">
                    Player 1 Choice: {gameRooms[roomId]?.player1?.choice || "-"}
                  </p>
                  <p className="text-color2">
                    Player 1 Lives:{" "}
                    {gameRooms[roomId].player1.lives
                      ? "❤️".repeat(gameRooms[roomId]?.player1?.lives)
                      : "-"}
                  </p>
                </div>
                <div className="bg-color4 p-2 rounded-lg">
                  <p className="text-color2">
                    Player 2 Name: {gameRooms[roomId]?.player2?.name || "No Name"}
                  </p>
                  <p className="text-color2">
                    Player 2 Choice: {gameRooms[roomId]?.player2?.choice || "-"}
                  </p>
                  <p className="text-color2">
                    Player 2 Lives:{" "}
                    {gameRooms[roomId].player2.lives
                      ? "❤️".repeat(gameRooms[roomId]?.player2?.lives)
                      : "-"}
                  </p>
                </div>
              </div>
              <p
                className={
                  gameRooms[roomId]?.status === "waiting"
                    ? "bg-color3 text-white px-2 py-1 rounded dark:bg-[#910c72] dark:text-[#dbdaa7]"
                    : "bg-color2 text-white px-2 py-1 rounded dark:bg-[#910c72] dark:text-[#dbdaa7]"
                }
              >
                Status: {gameRooms[roomId]?.status}
              </p>
              <div className="text-center">
                {gameRooms[roomId]?.status === "waiting" && (
                  <button
                    onClick={() => handleEnterGame(roomId)}
                    className="mt-4 bg-color2 mx-2 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Enter Game
                  </button>
                )}

                {selectedRoomId === roomId ? (
                  <>
                    <input
                      type="password"
                      placeholder="Enter room password"
                      className="mt-4 p-2 border rounded w-full placeholder-gray-500 dark:text-color2"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <button
                      onClick={() => handleDeleteRoom(roomId)}
                      className="mt-4 bg-color3 mx-2 text-white px-4 py-2 rounded hover:bg-red-700 dark:bg-[#ab1a77] dark:hover:bg-[#960e44]"
                    >
                      Confirm Delete Room
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedRoomId(roomId)}
                    className="mt-4 bg-color3 mx-2 text-white px-4 py-2 rounded hover:bg-red-700 dark:bg-[#ab1a77] dark:hover:bg-[#960e44]"
                  >
                    Delete Room
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rooms;
