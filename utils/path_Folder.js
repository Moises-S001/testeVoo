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
        if(!folder || folder.userId.toString()!== userId || !folder.isFolder){
            throw new Error('Caminho ivalido ou acesso negado');
        }
        folderNames.unshift(folder.name);
        currentFolderId = folder.parentFolderId;
    }
    const userBaseFolder = path.join(process.cwd(), 'uploads', userId);
    return path.join(userBaseFolder, ...folderNames);
 }
 
 module.exports = {getFolderPath};