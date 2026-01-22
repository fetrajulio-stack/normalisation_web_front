import PageHeader from "../../components/PageHeader";
import useThemeContext from "../../context/ThemeContext";

const Normalisation = () => {
  const { theme } = useThemeContext();

  return (
    <div className="p-6 dark:bg-[#080d24] min-h-[calc(100vh-72px-100px)]">
      {/* <h2 className="text-2xl font-bold text-[#080d24] dark:text-[#ffffff] mb-4">
        Normalisation
      </h2> */}
      <PageHeader />
      <p className="text-[#ffffff]">
        Contenu statique pour la page Normalisation.
      </p>
    </div>
  );
};

export default Normalisation;