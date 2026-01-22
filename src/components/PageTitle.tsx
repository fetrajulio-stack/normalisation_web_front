import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { menuItems } from "../constants/MenuItems";

export default function PageTitle() {
    const location = useLocation();

    useEffect(() => {
        const title = menuItems.find(item => item.path === location.pathname)?.title || "Normalisation";
        document.title = title;
    }, [location.pathname]);

    return null;
}