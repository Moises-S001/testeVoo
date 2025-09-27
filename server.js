// server.js
require('dotenv').config(); // Carrega as variáveis do arquivo .env
//const Busboy = require('busboy');
//const { promises: fsp } = require('fs');
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const conecteDB = require('./database.js');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 
const File = require('./modelos/File.js')
const User = require('./modelos/User.js');
const authenticateToken = require('./middleware/auth');
const fs = require('fs').promises; // Importe o módulo fs de forma assíncrona
const fsPromises = require('fs').promises;
const path = require('path'); // Importe o módulo path para lidar com caminhos
const upload = require('./config/multer.js');
const { getFolderPath}= require('./utils/path_Folder.js');
//inicio do codigo
// const corsOptions = {
//     origin: 'https://arquivos-voo.vercel.app', // A URL do seu frontend na Vercel
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//     optionsSuccessStatus: 204
// }
app.use(cors());

conecteDB().then(()=>{
    app.use(express.json());
  
app.get('/',(req,res) =>{
res.end("equipe TI voo")
})    

//tela admin, para ver todos os usuarios
app.get('/usuarios',authenticateToken, async (req, res) => {
    
    try{
        const users = await User.find();
        res.status(200).json(users);
    }catch(error){
        res.status(400).json({error: 'erro ao buscar usuarios', details: error.message})
    }
    
});
//tela login de usuarios do sistema
const secret = process.env.JWT_SECRET
app.post('/usuario/login', async (req, res) => {
    
    try{
    const {username, password } = req.body;
    
    const user = await User.findOne({ username });
    if(!user){
        return res.status(401).json({msg:'usuario invalido'});
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if(!passwordMatch){
        return res.status(401).json({msg:'senha invalida'});
    }
    
    const token = jwt.sign({ userId: user._id }, secret,{expiresIn: '1h'});
    res.status(201).json({token, message: 'Login bem sucedido!'});
    }catch(error){
        res.status(500).json({error:'erro ao fazer login', details: error.message });
    }
});
//lista as pastas e arquivos do usuario para ser exibido
app.get('/minhas-pastas',authenticateToken, async (req, res) => {
    try{
    const userId = req.user.userId;
    const { parentFolderId } = req.query; // Pega o folderId da query string, ex: ?parentFolderId=...

    let currentFolder = null

    if(parentFolderId){
        currentFolder = await File.findOne({ _id: parentFolderId, userId, isFolder:true});
        if(!currentFolder){
            return res.status(404).json({msg:'Pasta não encontrada ou acesso negado'});
        }
    }
    const filesAndFolder = await File.find({
        userId,
        parentFolderId: parentFolderId || null,
    }).sort({ isFolder: -1, name: 1});
    
      res.status(200).json({msg:'Conteudo da pasta',
        conteudo: filesAndFolder,
        currentFolder: currentFolder,
        parentOfCurrent: currentFolder ? currentFolder.parentFolderId : null,
      });


    }catch(error){
    console.log('Erro ao buscar conteudo da pasta do usuario:',error);
    res.status(500).json({error: 'error interno do servidor'});
    }
});
//cria a pasta do usuario cadastrado
app.post('/minhas-pastas',authenticateToken, async(req, res) => {
    try{
        const userId = req.user.userId;

        // Caminho completo para a pasta do usuário
      // O path.join evita problemas com barras de diretórios (/, \)
      const userFolderdePath = path.join(__dirname, 'uploads', userId);

      // Verifica se a pasta do usuário já existe
      await fs.mkdir(userFolderPath, { recursive: true });

      res.status(201).json({msg:'Pasta criada ou ja existente!',
        path: userFolderdePath
      });


    }catch(error){
        console.log('Erro ao criar pasta do usuario:',error);
        res.status(500).json({error: 'API Node.js está funcionando!'});
    }
     
});
//cria pasta no sistema.
app.post('/folder', authenticateToken,async(req, res)=>{
    try{
        const {name, parentFolderId}= req.body;
        const userId = req.user.userId;

        const newFolder = await File.create({
            userId,
            name,
            isFolder: true,
            parentFolderId: parentFolderId || null,
        });
        const parentPath = await getFolderPath(userId, parentFolderId);
        const folderPath = path.join(parentPath, name);
      
        await fs.mkdir(folderPath,{recursive: true});

        res.status(201).json({
            msg:'Pasta criada com sucesso!',
            folder: newFolder,
        });

    }catch(error){
        console.log('Erro ao criar a pasta na rota /folder:',error);
        res.status(500).json({error:'Erro interno do servido'})
    }
})
//download de arquivo do sistema para fora do sistema
app.get('/download/:fileId', authenticateToken, async (req, res)=>{
    try{
        const {fileId} = req.params;
        const userId = req.user.user.Id;

        const file = await file.findById(fileId);
        if (!file || file.userId.toString() !== userId){
            return res.status(404),json({msg: 'Arquivo não encontrado ou acesso negado'});
        }
        const folderPath = await getFolderPath(userId, file.parentFolderId);
        const filePath = path.join( folderPath, file.filename);

        if (!fs.existsSync(filePath)){
            return res.status(404).json({msg:'Arquivo no servidor não encontrado'})
        }

        res.setHeader('Content-Disposition', `àttachment; filename="${file.originalname}"`);
        res.download(filePath, file.originalname);

    }catch(error){
        console.log('Erro ao baixar arquivo:',error);
        res.status(500).json({error: 'Error interno do servido'});
    }
})
//excluir arquivo do proprio usuario
app.delete('/file/:fileId',authenticateToken, async(req, res) => {
     try{
        const { fileId } = req.params;
        const userId = req.user.userId;

        const file = await File.findByIdAndDelete({ _id: findById, userId});

    if (!file) {
      return res.status(404).json({ message: 'Arquivo não encontrado ou acesso negado' });
    }

    // 3. Montar o caminho completo e remover o arquivo do sistema
        const filePath = path.join(__dirname, 'uploads', userId, file.filename);

// O `fs.promises.unlink` remove o arquivo.
        await fs.unlink(filePath);
    
        res.status(200).json({ message: 'Arquivo deletado com sucesso!' });


     }catch(error){
        console.log('Erro ao deletar arquivo', error)
        res.status(500).json({error: 'Error interno do servidor'})
     }
});
//cadastra usuario para ter acesso ao sistema 
app.post('/usuarios/cadastro', async (req, res) => {
    
    try{
    const {username, password } = req.body
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, password: hashedPassword});
    await newUser.save();

    res.status(201).json({message: 'usuario cadastrado',nome:username,senha:password})
    }catch(error){
        res.status(400).json({error:'erro ao criar usuario', details: error.message });
    }

});


//upload de pastas para o sistema
app.post('/upload/folder', authenticateToken, multer().array('arquivos'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'Nenhum arquivo ou pasta enviado' });
        }

        const userId = req.user.userId;
        const parentFolderId = req.body.parentFolderId || null;
        
        // Loop para processar cada arquivo enviado
        for (const file of req.files) {
            // O caminho da pasta é recebido como um array JSON do frontend
            const caminhoPastaArray = JSON.parse(req.body.caminhoPasta);
            
            let currentParentId = parentFolderId;

            // Loop para criar a hierarquia de pastas
            for (const folderName of caminhoPastaArray) {
                // Verifica se a pasta já existe
                let folder = await File.findOne({
                    name: folderName,
                    parentFolderId: currentParentId,
                    isFolder: true,
                    userId: userId,
                });

                // Se a pasta não existe, cria uma nova
                if (!folder) {
                    folder = await File.create({
                        name: folderName,
                        parentFolderId: currentParentId,
                        isFolder: true,
                        userId: userId,
                        mimetype: 'folder',
                        path: null // Pastas não precisam de path físico
                    });
                }
                
                // Atualiza o parentId para a próxima iteração
                currentParentId = folder._id;
            }

            // Agora, lida com o upload do arquivo usando o ID da última pasta
            if (file) {
                const fileName = file.originalname;
                
                // Garante que o diretório físico existe
                const finalDestinationPath = path.join(process.cwd(), 'uploads', userId, ...caminhoPastaArray, fileName);
                await fs.mkdir(path.dirname(finalDestinationPath), { recursive: true });
                
                // Salva o arquivo no sistema de arquivos
                await fs.writeFile(finalDestinationPath, file.buffer);

                // Cria o registro do arquivo no banco de dados
                const newFile = await File.create({
                    name: fileName,
                    path: finalDestinationPath,
                    isFolder: false,
                    parentFolderId: currentParentId,
                    userId: userId,
                    mimetype: file.mimetype,
                    size: file.size,
                });

                console.log('Backend - Arquivo criado no banco de dados:', newFile.name, 'com parentId:', newFile.parentFolderId);
            }
        }

        res.status(201).json({ msg: 'Pasta e arquivos enviados com sucesso!' });

    } catch (error) {
        console.error('Erro no upload da pasta:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});


          
        
//upload de arquivo
app.post('/upload', authenticateToken, upload.single('arquivo'), async(req, res)=>{
    try{
        if (!req.file){
            return res.status(400).json({msg: 'nenhum arquivo enviado.'});
        }

        const userId = req.user.userId;
        const file = req.file;
        const { parentFolderId} = req.body;
        console.log(req)

        if (parentFolderId){
            const parentFolder = await File.findOne({ _id: parentFolderId, userId, isFolder: true});
            if (!parentFolder){
                return res.status(400).json({msg: 'Pasta-pai não encontrado ou acesso negado'});
            }
        }

// sava os dados do arquivo no mongoDB
       const newFile = await File.create({
        userId,
        name:file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        isFolder: false,
        parentFolderId: parentFolderId || null,
     });

        res.status(201).json({msg: 'Arquivo enviado e registrado com sucesso',
            file: newFile,
        });
    }catch(error){
        console.error('Erro no upload e registro:', error);
        res.status(500).json({error:'erro interno do servido'})
    }
})


app.delete('/usuarios/:id', authenticateToken, async (req, res) =>{

    try{
        const {id}= req.params;
        const deleteUser = await User.findByIdAndDelete(id);

        res.status(200).json({message: 'usuario deletado com sucesso'});
    }catch(error){
        res.status(400).json({error: 'erro ao deletar usuarios', details: error.message})
    }
   
});

//rota para visualizar o conteudo do arquivo
app.get('/file/:fileId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const fileId = req.params.fileId;
        const file = await File.findOne({
            _id: fileId,
            userId: userId
        });
console.log('passou aqui')
        if (!file) {
            return res.status(404).json({
                msg: 'Arquivo não encontrado.'
            });
        }
        
        // CORREÇÃO AQUI: Verificando o caminho físico do arquivo
        // Usamos fsPromises.access para verificar se o arquivo existe de forma assíncrona
        // O método .access() lança um erro se o arquivo não existir
        await fsPromises.access(file.path, fs.constants.F_OK);

        // Se o arquivo existir, envie-o
        res.download(file.path, file.name, (err) => {
            if (err) {
                console.error('Erro ao servir arquivo:', err);
                return res.status(500).send('Erro interno do servidor.');
            }
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                msg: 'O arquivo físico não foi encontrado no servidor.'
            });
        }
        console.error('Erro ao servir arquivo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });

// --- NOVA ROTA PÚBLICA PARA VISUALIZAÇÃO ---
    app.get('/view/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
    
    // Encontre o arquivo no banco de dados.
    // A rota é pública, mas você pode adicionar uma camada de segurança aqui se necessário
    // (ex: verificar se o arquivo é 'público' ou se o link é temporário).
        const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado.' });
    }

    // Serve o arquivo usando o caminho físico armazenado no banco de dados
    res.download(file.path, file.name, (err) => {
      if (err) {
        console.error('Erro ao servir arquivo para visualização:', err);
        return res.status(500).send('Erro interno do servidor.');
      }
    });

  } catch (error) {
    console.error('Erro na rota de visualização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
    });

    }
});


    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>{
        console.log(`Acesse: http://localhost:${PORT}`)
    })
    
})
