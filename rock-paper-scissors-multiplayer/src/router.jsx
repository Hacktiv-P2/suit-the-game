import { createBrowserRouter, redirect } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Rooms from "./pages/Rooms";
import RockPaperScissorsMultiplayer from "./RockPaperScissorsMultiplayer";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    loader: () => {
      const access_token = localStorage.getItem("suit_username");
      if (!access_token) {
        throw redirect("/login");
      }
      return null;
    },
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/rooms",
        element: <Rooms />,
      },
      {
        path: "/game/:gameId",
        element: <Game />,
      },
      {
        path: "/templateGame",
        element: <RockPaperScissorsMultiplayer />,
      },
    ],
  },
  {
    path: "/",
    loader: () => {
      const access_token = localStorage.getItem("suit_username");
      if (access_token) {
        throw redirect("/");
      }
      return null;
    },
    children: [
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
]);
