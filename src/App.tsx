import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Parametrage from "./pages/conssigne/Parametrage";
import Normalisation from "./pages/normalisation/Normalisation";
import ScrollToTop from "./components/ScrollToTop";
import PageTitle from "./components/PageTitle";
import Login from "./pages/auth/Login";
import { ProtectedRoute } from "./commons/ProtectedRoute";
import useAuth from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffff] dark:bg-[#080d24]">
      <Router>
        <PageTitle />
        <ScrollToTop />

        {user && <Header />}

        <main
          className={`flex-1 ${user ? "pt-[72px] md:pt-[80px] lg:pt-[88px]" : ""
            }`}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/parametrage" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/normalisation"
              element={
                <ProtectedRoute>
                  <Normalisation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametrage"
              element={
                <ProtectedRoute>
                  <Parametrage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {user && <Footer />}

      </Router>
    </div>
  );
}

export default App;
