const File = require('../modelos/File');
const path = require('path');

/*
* @param {String} userId
* @param {string | null} parentFolderId
* @returns {Promise<string>} 
*/
 async function getFolderPath(userId, parentFolderId = null) {
    const folderNames = []
    let currentFolderId = parentFolderId;

    while (currentFolderId){
        const folder = await File.findById(currentFolderId);

        if (!folder || !folder.isFolder) {
            throw new Error('Pasta pai não encontrada no banco de dados.');
        }

        if (folder.userId.toString() != userId) {
            throw new Error('Acesso negado: pasta pertence a outro usuário.')
        }


        folderNames.unshift(folder.name);
        currentFolderId = folder.parentFolderId;
    }
    const userBaseFolder = path.join(process.cwd(), 'uploads', userId);
    return path.join(userBaseFolder, ...folderNames);
 }
 
 module.exports = {getFolderPath};