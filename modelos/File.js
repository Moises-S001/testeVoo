const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, // Referencia o ID do usuário
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isFolder: { // Novo campo para diferenciar
    type: Boolean,
    default: false,
    required: true,
  },
  parentFolderId: { // Novo campo para a hierarquia
    type: Schema.Types.ObjectId,
    ref: 'File',
    default: null, // null indica que está na pasta raiz do usuário
  },
  filename: {
    type: String,
    sparse: true,
  },
  size: {
    type: Number,
   
  },
  mimetype: {
    type: String,
    
  },
  path: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model('File', FileSchema);

module.exports = File;