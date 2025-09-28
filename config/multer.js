const multer = require('multer');
const path = require('path');
const { promises: fs } = require('fs'); // Para garantir que a pasta do usuário existe
//const File = require('../modelos/File.js');
//const { getFolderPath}= require('../utils/path_Folder.js');

const normalizeFileName = (name) => {
    // 1. Remove o caminho da pasta para ficar apenas com o nome base
    const baseName = path.basename(name);
    
    // 2. Transforma caracteres acentuados em suas versões não acentuadas e remove outros lixos
    const normalized = baseName.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // Opcional: Substituir espaços por underscores e remover caracteres não alfanuméricos
    // const safeName = normalized.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return normalized; 
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // A propriedade file.originalname contém o caminho relativo da pasta
    // Ex: "nome_da_pasta/subpasta/arquivo.txt"
    const relativePath = file.originalname;

    // Remove o nome do arquivo para obter apenas o caminho da pasta
    const folderPathInUploads = path.dirname(relativePath);

    // O destino final no seu sistema de arquivos
    // Isso vai criar a estrutura de pastas dentro da pasta do usuário
    const userId = req.user.userId;
    const finalDestination = path.join(process.cwd(), 'uploads', userId, folderPathInUploads);

    try {
      // Cria o diretório (e os diretórios-mãe) se ele não existir
      await fs.mkdir(finalDestination, { recursive: true });
      cb(null, finalDestination);
    } catch (error) {
      console.error('Erro ao criar o diretório para o arquivo:', error);
      cb(error);
    }
  },

  // O nome do arquivo será apenas o nome base
  filename: (req, file, cb) => {
    // Pega o nome do arquivo, ex: "arquivo.txt"
    const safeFilename = normalizeFileName(file.originalname);
    cb(null, safeFilename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;