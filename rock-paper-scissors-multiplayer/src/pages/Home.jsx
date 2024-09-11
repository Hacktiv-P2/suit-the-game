import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Suit_High.png";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 p-6">
      {/* Hero Section */}
      <div className="text-center items-center justify-center mb-10">
        <img src={logo} style={{ height: "300px" }} className="mx-auto mb-8 dark:bg-[#dedede] rounded" />
        <p className="text-xl text-color2 dark:text-gray-300">
          Welcome to "Suit the Game" – a multiplayer rock-paper-scissors game!
        </p>
      </div>

      {/* Game Description */}
      <div className="bg-white dark:bg-gray-900 dark:text-gray-200 shadow-lg rounded-lg p-6 max-w-4xl text-center">
        <h2 className="text-2xl font-semibold text-color1 dark:text-gray-300 mb-4">How to Play</h2>
        <p className="text-lg text-[#6e1833] dark:text-gray-400 mb-6">
          Rock-paper-scissors is a simple and fun game that everyone can play.
          In this multiplayer version, you can challenge other players in
          real-time! The rules are easy: rock beats scissors, scissors beat
          paper, and paper beats rock. Join a game room and get ready to play!
        </p>
      </div>

      {/* Call to Action */}
      <div className="mt-10">
        <Link
          to={"/rooms"}
          className="bg-color2 text-white dark:bg-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-color3 dark:hover:bg-gray-600"
        >
          Start Playing
        </Link>
      </div>

      {/* Footer */}
      <hr/>
      <footer className="mt-12 text-color1 dark:text-gray-400">
        <p>© 2024 Suit The Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
