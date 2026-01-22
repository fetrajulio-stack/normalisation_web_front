import PageHeader from "../../components/PageHeader";
import useThemeContext from "../../context/ThemeContext";

const Parametrage = () => {
  const { theme } = useThemeContext();

  return (
    <div className="p-6 bg-[#ffffff] dark:bg-[#080d24] min-h-[calc(100vh-72px-100px)]">
      {/* <h2 className="text-2xl font-bold text-[#080d24] dark:text-[#ffffff] mb-4">
        Paramétrage Consigne
      </h2> */}
      <PageHeader />
      <p className="text-gray-800 dark:text-gray-200">
        Contenu statique pour la page de Paramétrage consigne.
      </p>
    </div>
  );
};

export default Parametrage;
