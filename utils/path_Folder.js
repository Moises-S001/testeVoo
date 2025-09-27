const File = require('../modelos/File');
const path = require('path');

/*
* @returns {Promise<string>} 
*/
 async function getFolderPath(userIdString, parentFolderIdString = null) {
    const folderNames = []
    let currentFolderId = parentFolderIdString;

    while (currentFolderId){
        const folder = await File.findById(currentFolderId);

        if (!folder || !folder.isFolder) {
            throw new Error('Pasta pai não encontrada no banco de dados.');
        }

        if (folder.userId.toString() != userIdString) {
            throw new Error('Acesso negado: pasta pertence a outro usuário.')
        }


        folderNames.unshift(folder.name);
        currentFolderId = folder.parentFolderId ? folder.parentFolderId.toString() : null;
    }

    const userBaseFolder = path.join(process.cwd(), 'uploads', userIdString);
    return path.join(userBaseFolder, ...folderNames);
 }
 
 module.exports = {getFolderPath};