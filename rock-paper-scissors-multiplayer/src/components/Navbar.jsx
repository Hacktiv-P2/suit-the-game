import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Suit_High.png";
import { useEffect, useState } from "react";
const Navbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("suit_username");
    navigate("/login");
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");
    return savedTheme === "true";
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  return (
    <nav className="bg-color1 p-4 dark:bg-color2">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={"/"}>
          <img
            src={logo}
            alt="nav-logo"
            style={{ height: "40px" }}
            className="mr-4"
          />
        </Link>
        <div className="flex-grow">
        <li>
            <button
              onClick={toggleDarkMode}
              className="text-color2 hover:text-color4 p-2 rounded dark:text-color4 dark:bg-color2 dark:hover:bg-[#005291]"
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </li>
        </div>
        <ul className="flex space-x-4">
          <li>
            <Link
              to={"/"}
              className="text-color2 hover:text-color4 hover:bg-color2 p-2 rounded dark:text-color4 dark:hover:bg-[#005291]"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to={"/rooms"}
              className="text-color2 hover:text-color4 hover:bg-color2 p-2 rounded dark:text-color4 dark:hover:bg-[#005291]"
            >
              Rooms
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="text-color2 hover:text-color4 cursor-pointer hover:bg-color2 p-2 rounded dark:text-color4 dark:hover:bg-[#870420]"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
