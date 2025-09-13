const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.URLBancoDB;
async function conecteDB() {
    try{
        await mongoose.connect(uri);
        console.log('sucess BancoDB')

    }catch(error){
        console.log('Erro ao conectar ao BancoDB', error);
        process.exit(1);

    }
};
module.exports = conecteDB