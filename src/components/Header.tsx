import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { MenuIcon, XIcon, User, LogOut, Settings } from "lucide-react";
import useThemeContext from "../context/ThemeContext";
import useAuth from "../context/AuthContext";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo-dark.svg";
import ThemeToggle from "./ThemeToggle";
import { menuItems } from "../constants/MenuItems";

export default function Header() {
  const { theme } = useThemeContext();
  const { user, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (openMobileMenu) {
      document.body.classList.add("max-md:overflow-hidden");
    } else {
      document.body.classList.remove("max-md:overflow-hidden");
    }
  }, [openMobileMenu]);

  console.log(user);

  return (
    <nav className={`flex items-center justify-between fixed z-50 top-0 w-full px-6 md:px-16 lg:px-24 xl:px-32 py-4 ${openMobileMenu ? '' : 'backdrop-blur'} bg-white/70 dark:bg-[#080d24]/70`}>
      <Link to="/">
        <img
          className="h-9 md:h-9.5 w-auto shrink-0"
          src={theme === "dark" ? logoLight : logoDark}
          alt="Logo"
        />
      </Link>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center gap-8">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="text-[#080d24] dark:text-[#ffffff] hover:text-[#FC8404] dark:hover:text-[#FC8404] transition"
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Mobile menu */}
      <div className={`fixed inset-0 flex flex-col items-center justify-center gap-6 text-lg font-medium bg-white/60 dark:bg-black/40 backdrop-blur-md md:hidden transition duration-300 ${openMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="text-[#080d24] dark:text-[#ffffff] hover:text-[#FC8404] dark:hover:text-[#FC8404]"
            onClick={() => setOpenMobileMenu(false)}
          >
            {item.name}
          </Link>
        ))}
        <button className="aspect-square size-10 p-1 items-center justify-center bg-[#FC8404] hover:bg-[#FC8404] transition text-white rounded-md flex" onClick={() => setOpenMobileMenu(false)}>
          <XIcon />
        </button>
      </div>

      {/* Right side desktop */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {user && (
          <div className="relative">
            {/* Avatar rond */}
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="w-10 h-10 rounded-full bg-[#FC8404] flex items-center justify-center text-white shadow-md hover:shadow-lg transition"
            >
              <User size={20} />
            </button>

            {/* Dropdown */}
            {openDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#080d24] border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-800 dark:text-gray-100"
                  onClick={() => setOpenDropdown(false)}
                >
                  <Settings size={16} /> Modifier le profil
                </Link>
                <button
                  onClick={() => { logout(); setOpenDropdown(false); }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-800 dark:text-gray-100 w-full text-left"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        )}

        <ThemeToggle />

        {/* Mobile menu toggle */}
        <button onClick={() => setOpenMobileMenu(!openMobileMenu)} className="md:hidden">
          <MenuIcon size={26} className="text-[#080d24] dark:text-white active:scale-90 transition" />
        </button>
      </div>
    </nav>
  );
}
