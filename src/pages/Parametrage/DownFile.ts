export const downloadFilesSequentially = async (filenames: string[]): Promise<void> => {
    for (const filename of filenames) {
        try {
            // 1. On attend que le fichier soit réellement téléchargé en mémoire (Blob)
            const response = await fetch(`http://127.0.0.1:8000/api/normalisation/download/${filename}`);
            const blob = await response.blob();
           
            // 2. On crée une URL locale pour ce Blob
            const url = window.URL.createObjectURL(blob);
           
            // 3. On crée le lien et on déclenche
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
           
            // 4. Nettoyage important
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url); // Libère la mémoire
 
            // On laisse un petit répit au navigateur pour traiter l'UI
            await new Promise(resolve => setTimeout(resolve, 500));
           
        } catch (error) {
            console.error(`Erreur sur le fichier ${filename}`, error);
        }
    }
};