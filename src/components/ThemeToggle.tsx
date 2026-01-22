import { MoonIcon, SunIcon } from "lucide-react";
import useThemeContext from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, setTheme } = useThemeContext();

    const toggleTheme = () => {
        if (theme === "dark") {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
            localStorage.setItem("theme", "light");
            setTheme("light");
        } else {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setTheme("dark");
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-full bg-[#080d24]/5 hover:bg-[#080d24]/10 dark:bg-[#ffffff]/10 dark:hover:bg-[#ffffff]/20 transition-colors duration-200"
        >
            {theme === "dark" ? <SunIcon className="text-orange-400" /> : <MoonIcon className="text-[#080d24]" />}
        </button>
    );
}
