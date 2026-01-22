import { Link, useLocation } from "react-router-dom";
import { pagesConfig } from "../config/pages";

export default function PageHeader() {
  const { pathname } = useLocation();
  const page = pagesConfig[pathname];

  if (!page) return null;

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-slate-400 mb-2">
        {page.breadcrumb.map((item, index) => (
          <span key={index}>
            {index === 0 ? (
              <Link
                to="/"
                className="hover:text-[#FC8404] transition"
              >
                {item}
              </Link>
            ) : (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-900 dark:text-slate-100">
                  {item}
                </span>
              </>
            )}
          </span>
        ))}
      </nav>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#080d24] dark:text-white">
        {page.title}
      </h1>
    </div>
  );
}