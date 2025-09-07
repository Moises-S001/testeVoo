const multer = require('multer');
const path = require('path');
const { promises: fs } = require('fs'); // Para garantir que a pasta do usuário existe
//const File = require('../modelos/File.js');
//const { getFolderPath}= require('../utils/path_Folder.js');

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
    const filename = path.basename(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;