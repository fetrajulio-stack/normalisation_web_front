import { Link } from "react-router-dom";
import useThemeContext from "../context/ThemeContext";
import logoLight from "../assets/logo-light.svg";
import logoDark from "../assets/logo-dark.svg";
import { menuItems } from "../constants/MenuItems";

export default function Footer() {
  const { theme } = useThemeContext();

  return (
    <footer className="relative px-6 md:px-16 lg:px-24 xl:px-32 mt-5 w-full bg-[#ffffff] dark:bg-[#080d24] text-gray-900 dark:text-slate-50">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-200 dark:border-slate-700 pb-6">

        {/* Logo + description */}
        <div className="max-w-md">
          <a href="#">
            <img
              className="h-9 md:h-10 w-auto"
              src={theme === "dark" ? logoLight : logoDark}
              alt="Logo"
            />
          </a>
          <p className="mt-6 text-sm text-justify">
            Simplifiez le traitement de vos données grâce à une solution de normalisation basée sur des consignes claires, permettant d’obtenir des résultats fiables, cohérents et facilement exploitables.
          </p>
        </div>

        {/* Links */}
        <div className="flex-1 flex items-start md:justify-end gap-20 text-sm">
          <div>
            <h2 className="font-semibold mb-4 text-sm">
              Menu
            </h2>
            <ul className="space-y-2">
              {menuItems.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="hover:text-[#FC8404] dark:hover:text-white transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="pt-4 pb-5 text-center text-xs">
        Copyright © 2026 Normalisation • by Outsourcia-group • Tous droits réservés.
      </p>
    </footer>
  );
}
