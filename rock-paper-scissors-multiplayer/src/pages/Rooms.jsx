import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, remove, set, push } from "firebase/database"; // Import push dan set untuk create room

const Rooms = () => {
  const [gameRooms, setGameRooms] = useState({});
  const navigate = useNavigate();

  // Fetch existing game rooms from Firebase
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

  // Create a new game room
  const createGameRoom = () => {
    const roomId = Date.now().toString(); // Menggunakan timestamp dari Date untuk ID unik
    const newRoomRef = ref(db, `games/${roomId}`);
    const roomData = {
      player1: { choice: "", lives: 3 },
      player2: { choice: "", lives: 3 },
      status: "waiting",
    };

    set(newRoomRef, roomData) // Save the new room to Firebase
      .then(() => {
        alert("New room created!");
        fetchGameRooms(); // Refresh the room list
      })
      .catch((error) => {
        console.error("Error creating room: ", error);
        alert("Failed to create room");
      });
  };

  // Handle room deletion
  const handleDeleteRoom = (roomId) => {
    const roomRef = ref(db, `games/${roomId}`);
    remove(roomRef)
      .then(() => {
        alert(`Room ${roomId} deleted successfully!`);
        fetchGameRooms(); // Refresh the list after deleting
      })
      .catch((error) => {
        console.error("Error deleting room: ", error);
        alert("Error deleting room");
      });
  };

  // Handle entering a game room
  const handleEnterGame = (roomId) => {
    navigate(`/game/${roomId}`); // Navigate to the game page with the roomId
  };

  useEffect(() => {
    fetchGameRooms();
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <button
        onClick={fetchGameRooms}
        className="mb-4 bg-color2 text-white px-4 py-2 rounded hover:bg-color3"
      >
        Refresh Game Rooms
      </button>

      <button
        onClick={createGameRoom} // Add button to create a new game room
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create New Game Room
      </button>

      <div className="flex flex-wrap justify-center items-center gap-6">
        {!gameRooms || Object.keys(gameRooms).length === 0 ? (
          <div className="bg-color3 text-white px-2 py-1 rounded">
            No Rooms Found
          </div>
        ) : (
          Object.keys(gameRooms).map((roomId) => (
            <div
              key={roomId}
              className="bg-color1 text-color2 p-4 rounded-lg shadow-md w-80"
            >
              <h2 className="text-lg font-bold mb-2">Room ID: {roomId}</h2>
              <div className="mb-4">
                <div className="bg-color4 p-2 rounded-lg mb-2">
                  <p className="text-color2">
                    Player 1 Choice:{" "}
                    {gameRooms[roomId].player1.choice || "None"}
                  </p>
                  <p className="text-color2">
                    Player 1 Lives:{" "}
                    {gameRooms[roomId].player1.lives
                      ? "❤️".repeat(gameRooms[roomId].player1.lives)
                      : "None"}
                  </p>
                </div>
                <div className="bg-color4 p-2 rounded-lg">
                  <p className="text-color2">
                    Player 2 Choice:{" "}
                    {gameRooms[roomId].player2.choice || "None"}
                  </p>
                  <p className="text-color2">
                    Player 2 Lives:{" "}
                    {gameRooms[roomId].player2.lives
                      ? "❤️".repeat(gameRooms[roomId].player2.lives)
                      : "None"}
                  </p>
                </div>
              </div>
              <p className="bg-color3 text-white px-2 py-1 rounded">
                Status: {gameRooms[roomId].status}
              </p>
              <button
                onClick={() => handleEnterGame(roomId)} // Add button to enter the game
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Enter Game
              </button>
              <button
                onClick={() => handleDeleteRoom(roomId)}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Room
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rooms;
