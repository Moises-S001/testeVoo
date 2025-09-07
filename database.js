const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27017';
async function conecteDB() {
    try{
        await mongoose.connect(uri);
        console.log('sucess')

    }catch(error){
        console.log('Erro', error);
        process.exit(1);

    }
};
module.exports = conecteDB