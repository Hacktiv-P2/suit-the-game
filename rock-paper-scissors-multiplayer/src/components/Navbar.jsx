import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Suit_High.png";
const Navbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("suit_username");
    navigate("/login");
  };

  return (
    <nav className="bg-color1 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={"/"}>
          <img
            src={logo}
            alt="nav-logo"
            style={{ height: "40px" }}
            className="mr-4"
          />
        </Link>
        <div className="flex-grow"></div>
        <ul className="flex space-x-4">
          <li>
            <Link
              to={"/"}
              className="text-color2 hover:text-color4 hover:bg-color2 p-2 rounded"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to={"/rooms"}
              className="text-color2 hover:text-color4 hover:bg-color2 p-2 rounded"
            >
              Rooms
            </Link>
          </li>
          <li>
            <Link
              onClick={handleLogout}
              className="text-color2 hover:text-color4 cursor-pointer hover:bg-color2 p-2 rounded"
            >
              Logout
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
