// src/middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');


const secret =process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
 
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer TOKEN'

  // 2. Se o token não existir, retorne 401 (Não Autorizado)
  if (token == null) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  if(!token){
    return res.status(401).json({msg: 'Acesso negado'});
  }

  // 3. Verificar o token
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }

    // 4. Anexar os dados do usuário do token à requisição
    // user = { userId: ... }
    req.user = user;
    
    // 5. Chamar o próximo middleware ou a rota principal
    next();
  });
};

module.exports = authenticateToken;