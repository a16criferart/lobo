console.log("Hola, iniciando");
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

console.log("Vamos a cargar las páginas:");
router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
  //__dirname : It will resolve to your project folder.
});

router.get('/jugar',function(req,res){
  res.sendFile(path.join(__dirname+'/public/jugar.php'));
});

router.get('/perfil',function(req,res){
  res.sendFile(path.join(__dirname+'/public/perfil.html'));
});

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);
console.log("ok");
console.log('Running at Port 3000');
