// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

//definir archivos
var path = require("path");
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/img', express.static(__dirname + '/public/img'));

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


// SOCKETS Y PARTIDA!! #hate :(  ======================================================================

//CONEXIO DB
const admin = require('firebase-admin');

var serviceAccount = require('./public/js/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore()

//VARS DE LA DB
var DBJugadores = db.collection('usuarios');
var DBPartida = db.collection('partida');

//VARS DE LA PARTIDA
var IDPartida=  "avKFrF5ZFS9OxrJDgAy3";
var IDSala = "phk5QBx6nefQHBrePDAz";
var EstadoPartida ="Pendiente";
var NumUsuarios=" ";
console.log("El estado actual de la partida es:" +EstadoPartida);

//SNAPSHOTS

  //SNAPSHOT JUGADORES DE LA SALA
    var SnapJugadores =DBJugadores.onSnapshot(llistaJugadors => {
      console.log("SNAPSHOT ===> jugadors");
      var getJugadores = db.collection('usuarios').get()
      .then(usuarios => {
          console.log("En la sala hay:  "+usuarios.size+ " jugadores");

          //CARGAR TABLERO
          io.sockets.emit("ActualizarTablero");

          //Si hay 8 o más y no se ha empezado la partida
          NumUsuarios=usuarios.size;
          if(usuarios.size==26 && EstadoPartida=="Pendiente")
            cambiar_estado(EstadoPartida="Empezada");
          else if(usuarios.size>=8  && EstadoPartida=="Pendiente"){
            console.log(EstadoPartida);
            manejar_estado();
          }

          //Si no los hay
          else if(usuarios.size<8  && EstadoPartida=="Pendiente")
            console.log("Aún no hay suficientes jugadores");

          if (EstadoPartida!="Pendiente"){

            //COMPROBAR MUERTOS
             db.collection("usuarios").where("estado", "==", "muerto").get()
             .then(function(querySnapshot){
               querySnapshot.forEach(function(doc){
                 var refM =  db.collection("usuarios").doc(doc.id);
                return refM.update({
                  avatar: "http://i64.tinypic.com/t6w66u.jpg"
                });
               });
             });
          }
      })
      .catch(err => {
        console.log('Error getting document', err);
      });

    }, err => {
      console.log(`Encountered error: ${err}`);
    });

  //SNAPSHOT PARTIDA
    var SnapPartida =DBPartida.onSnapshot(docSnapshot => {
    console.log("SNAPSHOT ===> partida");

    //Cogemos el estado de la PARTIDA
    var getEstado =DBPartida.doc(IDPartida).get()
      .then(doc => {
        if (!doc.exists) {
          console.log('No se ha encontrado la partida!!!');
        } else {
          EstadoPartida= doc.data().estado;
          console.log('Estado de la partida:'+EstadoPartida);
        }
      });

    }, err => {
      console.log(`Encountered error: ${err}`);
    });


//SOCKET
var server = require('http').Server(app);
var io = require('socket.io')(server);
//chat
var messages = [];
var messagesN = [];
//votos
var votos = new Map();
var votosPiscopata = new Map();
var votosLobo = new Map();
var ArrayVotos = [];
var ArrayVotosLobo = [];
var ArrayMuertos= [];
var AuxNombreMasVotado;
var CopiaAuxMasVotado;
var CopiaAuxMasVotadoLobos;
//partida
var partidaAcabada = false;
//roles
var ArrayAldea = [];
var ArrayLobos = [];
var ObjetivoRol=null;
var NombreUsuarioRol=null;
var BalasRestantes=2;
var CargaHechicero=true;
var AguaBendita=1;
var cuchillada=true;
var IdBufon=null;
var ProtegidoDoctor=null;
var ProtegidoGuarda=null;
var Guardaespaldas=null;
var IdAsesino=null;
//===SOCKET===
io.on('connection', function(socket) {
  socket.emit('hola', EstadoPartida);
  io.sockets.emit("ActualizarTablero");

  //chat dia
  socket.emit('messages', messages);

  socket.on('new-message', function(data) {

    messages.push(data);

    io.sockets.emit('messages', messages);
  });
  //chat noche
  socket.emit('messagesN', messagesN);

  socket.on('new-messageN', function(data) {

    messagesN.push(data);

    io.sockets.emit('messagesN', messagesN);
  });

//========Roles=========
//Lobo recibido en el cliente, avisa al servidor
socket.on("EnviarLobo", function(userId){
  //Hemos recibido la id de un lobo, la guardamos en el array
  if(ArrayLobos.includes(userId))
    ArrayLobos.push(userId);
});

//Bufon
//Bufón recibido en el cliente, avisa al servidor
socket.on("EnviarBufon", function(userId){
  //Aguardamos el Bufón
  IdBufon=userId;
  //Lo enviamos a los clientes
  io.sockets.emit("DevolverBufon", IdBufon)
});
//ALDEA
socket.on("EnviarAldea", function(aldeano){
  if(!ArrayAldea.includes(aldeano))
    ArrayAldea.push(aldeano);
});
//Psicopata
socket.on("EnviarPsicopata", function(asesino){
  IdAsesino=asesino;
});

//pistolero
socket.on("Balas", function(userId, UsuarioVotado, username){
  //el pistolero aun tiene balas?
  if(BalasRestantes!=0){
    //disparamos
    MatarUsuario(UsuarioVotado);
    //Añadimos al muerto
    ArrayMuertos.push(UsuarioVotado);
    //Cogemos el nombre del usuario disparado
    var nombre = sacarNombre(UsuarioVotado);
    sleep(1000);
    ObjetivoRol=nombre;
     //Si hay algun objetivo
         if(ObjetivoRol!=null){
             //Estructuramos el mensaje
             var texto ="<i>El pistolero <b>"+username+"</b> ha disparado a <b>"+ObjetivoRol+" </b></i>";
           }
          else{
            //Estructuramos el mensaje
            var texto ="<i>El pistolero <b>"+username+"</b> ha disparado. </b></i>";
          }
             var msj = {
               author: "- Servidor -",
               text: texto
             }
             //Enviamos el mensaje por chat
             messages.push(msj);
             io.sockets.emit('messages', messages);
             //le quitamos una bala
             BalasRestantes--;
             //Mensaje por Servidor
             console.log("El pistolero ha gastado una bala. Le quedan "+BalasRestantes);
    //La pistola hace mucho ruido... Revelamos su rol
      revelarRol(userId);
       //actualizamos los tableros
       io.sockets.emit("ActualizarTablero");
  }
  else
    //No ha ido bien o de forma esperada.
    socket.emit("ErrorPistolero");

});

socket.on("RevealHechicero", function(UsuarioVotado){
  //el hechicero aun tiene carga?
  if(CargaHechicero==true){

    //cogemos el nombre
    ObjetivoRol=sacarNombre(UsuarioVotado);

    //lo revelamos
     revelarRol(UsuarioVotado);
     //Si hay algun objetivo
         if(ObjetivoRol!=null){
             //Estructuramos el mensaje
             var texto ="<i>El hechicero ha revelado a <b>"+ObjetivoRol+"</b></i>";
           }
          else{
            //Estructuramos el mensaje
            var texto ="<i>El hechicero ha revelado a un aldeano</b></i>";
           }
             var msj = {
              author: "- Servidor -",
              text: texto
            }
            //Enviamos el mensaje por chat
            messages.push(msj);
            io.sockets.emit('messages', messages);


      //actualizamos los tableros
      io.sockets.emit("ActualizarTablero");
      //le quitamos la carga
      CargaHechicero=false;
}
 else
   //No ha ido bien o de forma esperada.
   socket.emit("ErrorHechicero");

});

//cura
socket.on("AguaBendita", function(userId, UsuarioVotado, username){
  //el cura aun tiene agua?
  if(AguaBendita==1){
    //Es lobo?
    if(ArrayLobos.includes("UsuarioVotado")){
      //era lobo, lo matamos
      var muerto=UsuarioVotado
      var txt="¡Sí era un lobo!";
    }
    //no era lobo! Nos morimos
    else {
      var muerto=userId;
      var txt="¡No era un lobo!";
    }
    //matamos
    MatarUsuario(muerto);
    //Añadimos al muerto
    ArrayMuertos.push(muerto);
    //cogemos el nombre
    ObjetivoRol= sacarNombre(muerto);
     //Si hay algun objetivo
         if(ObjetivoRol!=null){
             //Estructuramos el mensaje
             var texto ="<i>El cura <b>"+username+"</b> ha echado agua bendita a <b>"+ObjetivoRol+" </b>."+txt+"</i>";
           }
          else{
            //Estructuramos el mensaje
            var texto ="<i>El cura ha echado agua bendita."+txt+"</i>";
           }
           var msj = {
             author: "- Servidor -",
             text: texto
           }
             //Enviamos el mensaje por chat
             messages.push(msj);
             io.sockets.emit('messages', messages);
             //le quitamos el agua
             AguaBendita=0;
             //Mensaje por Servidor
             console.log("El cura ha gastado su agua bendita");

    //Eso ha revelado al cura
      revelarRol(userId);
       //actualizamos los tableros
       io.sockets.emit("ActualizarTablero");
  }
});


//Psicópata
socket.on("Cuchillada", function(UsuarioVotado, userId){
  IdAsesino=userId;

  if(cuchillada==true){
      //matamos
      MatarUsuario(UsuarioVotado);
      //Añadimos al muerto
      ArrayMuertos.push(UsuarioVotado);
      //Cogemos el nombre del usuario muerto
      var nombre = sacarNombre(UsuarioVotado);
      ObjetivoRol=nombre;
       //Si hay algun objetivo
           if(ObjetivoRol!=null){
               //Estructuramos el mensaje
               var texto ="<i>El psicópata ha asesinado a <b>"+ObjetivoRol+" </b> esta noche</i>";
             }
             else{
              //Estructuramos el mensaje
              var texto ="<i>El psicópata ha asesinado a alguien esta noche</i>";
             }
             var msj = {
                author: "- Servidor -",
                text: texto
            }
               //Enviamos el mensaje por chat
               messages.push(msj);
               io.sockets.emit('messages', messages);
               //le quitamos una bala
               AguaBendita=0;
               //Mensaje por Servidor
               console.log("El asesino ha matado a un jugador");

         //actualizamos los tableros
         io.sockets.emit("ActualizarTablero");
         //Le quitamos la cuchillada para esta Noche
         cuchillada=false;
  }
});

socket.on("ProteccionDoctor", function(UsuarioVotado){
      ProtegidoDoctor=UsuarioVotado;
});
socket.on("ProteccionGuarda", function(UsuarioVotado, userId){
    if (Guardaespaldas==null)
    Guardaespaldas=userId;

    ProtegidoGuarda=UsuarioVotado;
});

//========Votaciones=======
//==VOTO ALDEA==
  socket.on("voto", function(UsuarioVotado, userId, username) {
    var ArrayVotos = [];
    var muerto = false;
    //El usuario estaba muerto antes?
    if(ArrayMuertos.includes(UsuarioVotado))
      muerto = true;

      //Si es hora de votar actua:
      if(EstadoPartida == "Votaciones" && muerto == false){
      console.log("El usuario "+userId+" ha votado a "+UsuarioVotado);

      //userId es el que vota, UsuarioVotado al que votamos
      votos.set(userId, UsuarioVotado);

      for (var [key, value] of votos.entries() ) {
        ArrayVotos.push(value);
      }

      //Enviamos el voto a los clientes
      io.sockets.emit('VotoRecibido', ArrayVotos);
      //Cogemos el nombre del usuario votado
      var nombre = sacarNombre(UsuarioVotado);
      ObjetivoRol=nombre;
      if(ObjetivoRol!=null){
          //Estructuramos el mensaje
          var texto ="<i>El usuario <b>"+username+"</b> ha votado a <b>"+ObjetivoRol+" </b></i>";
      }else{
          //Estructuramos el mensaje
          var texto ="<i>El usuario <b>"+username+"</b> ha votado para linchar esta noche</b></i>";
      }
          var msj = {
            author: "- Servidor -",
            text: texto
          }
          //Enviamos el mensaje por chat
          messages.push(msj);
          io.sockets.emit('messages', messages);

    }
  });

//==VOTO LOBO==
  socket.on("votoLobo", function(UsuarioVotado, userId, username) {
    var ArrayVotosLobo = [];
    var muerto = false;
    var comp=false;
    //El usuario estaba muerto antes?
    if(ArrayMuertos.includes(UsuarioVotado)){
        muerto = true;
    }
    //Comprobamos que no hayamos votado a un lobo
    if(ArrayLobos.includes(UsuarioVotado))
      comp=true;

      //Si es  de noche actua:
    if(EstadoPartida == "Noche" && muerto == false && comp!=true){
      console.log("El lobo "+userId+" ha votado a "+UsuarioVotado+" para que muera esta noche");

      //userId es el que vota, UsuarioVotado al que votamos
      votos.set(userId, UsuarioVotado);

      for (var [key, value] of votos.entries() ) {
        ArrayVotosLobo.push(value);
      }

      //Enviamos el voto a los clientes
      io.sockets.emit('VotoRecibidoLobo', ArrayVotosLobo);
      //Cogemos el nombre del usuario votado
      var nombre = sacarNombre(UsuarioVotado);
      sleep(1000);
      ObjetivoRol=nombre;
      if(ObjetivoRol=null){
          //Estructuramos el mensaje
          var texto ="<i>El lobo  <b>"+username+"</b> ha votado a <b>"+ObjetivoRol+" para que muera esta noche </b></i>";

        }
        else {
          //Estructuramos el mensaje
          var texto ="<i>El lobo  <b>"+username+"</b> ha votado a un usuario para que muera esta noche </b></i>";
        }
        var msj = {
          author: "- Servidor -",
          text: texto
        }
          //Enviamos el mensaje por chat
          messagesN.push(msj);
          io.sockets.emit('messagesN', messagesN);

    }
  });

  //CONTROL DE MUERTOS
  //Más votado
  socket.on("MasVotado", function(MasVotado, MasVotos){
    if(IdBufon!=null && MasVotado==IdBufon){
      var msj = {
        author: "- Servidor -",
        text: "<h2><b>¡La aldea ha linchado al bufón! ¡Él gana!</h2></b>"
      }
        Equipo="Bufón";
        io.sockets.emit("PartidaGanada", Equipo);
    }
    else{
      //Cambiamos su estado vivo ---> muerto
      MatarUsuario(MasVotado);
      //Añadimos al muerto
      ArrayMuertos.push(MasVotado);
      //Log en el servidor
     console.log("Se ha matado al usuario "+MasVotado+" con "+MasVotos+" votos.");

     //Sacamos el usuario
     nombre= sacarNombre(MasVotado);
     //Si alguien ha sido linchado...
     if(nombre!=null && nombre!=CopiaAuxMasVotado){
       //Mensaje en el chat
       var msj = {
         author: "- Servidor -",
         text: "<h5><b>"+nombre +" ha sido linchado hoy.</h5></b>"
       }
     }
     else{
       var msj = {
         author: "- Servidor -",
         text: "<h5><b>Se ha linchado hoy.</h5></b>"
       }
     }
       //Guardamos el ultimo linchado
       CopiaAuxMasVotado=nombre;
       //actualizamos tablero
       socket.emit("ActualizarTablero");

     votos.clear();
    }
    //Enviamos el mensaje por chat
    messages.push(msj);
    io.sockets.emit('messages', messages);
  });
  //Más votado de los lobos
  socket.on("MasVotadoLobos", function(MasVotadoLobos, MasVotosLobos){

    if (MasVotadoLobos==ProtegidoGuarda){
      MatarUsuario(Guardaespaldas);
      console.log("El guardaespaldas ha protegido ha dado su vida por alguien esta noche");
      var msj = {
        author: "- Servidor -",
        text: "<h5>El guardaespaldas ha protegido ha dado su vida por alguien esta noche.</h5>"
      }
      messages.push(msj);
      io.sockets.emit('messages', messages);
    }
    else if (MasVotadoLobos==ProtegidoDoctor){
      console.log("El Doctor ha salvado la vida a alguien esta noche");
      var msj = {
        author: "- Servidor -",
        text: "<h5>El Doctor ha salvado la vida a alguien esta noche</h5>"
      }
      messages.push(msj);
      io.sockets.emit('messages', messages);
    }
    else {
      //Cambiamos su estado vivo ---> muerto
      MatarUsuario(MasVotadoLobos);
      //Añadimos al muerto
      ArrayMuertos.push(MasVotadoLobos);
      //Log en el servidor
      console.log("Los lobos han matado al "+MasVotadoLobos+" con "+MasVotosLobos+" votos.");

      //Sacamos el usuario
      var nombre = sacarNombre(MasVotadoLobos);
      //Si alguien ha sido linchado...
      if(AuxNombreMasVotado!=null && nombre!=CopiaAuxMasVotadoLobos){
        //Mensaje en el chat
        var msj = {
          author: "- Servidor -",
          text: "<h5>Los lobos han matado a <b>"+nombre +"con "+MasVotosLobos+" votos.</h5></b>"
          }
      }
      else{
        var msj = {
          author: "- Servidor -",
          text: "<h5>Los lobos han matado a un jugador esta noche.</h5></b>"
          }
        }
        //Enviamos el mensaje por chat
        messages.push(msj);
        io.sockets.emit('messages', messages);
        //Guardamos el ultimo linchado
        CopiaAuxMasVotado=nombre;
    }
        votos.clear();

    //actualizamos tablero
    socket.emit("ActualizarTablero");

  });


//====FIN DE PARTIDA====
socket.on("FinalizarPartida", function(){
  EstadoPartida="Finalizada"
});


//===ESTADOS DE GANADO====

//Si hay menos aldea que Lobos
socket.on("CheckGanada", function(){
  if(EstadoPartida!="Pendiente" && EstadoPartida!="Asignando" && EstadoPartida != "Empezada"){
    console.log("Entrando en el comprobador de ganada");
    var Equipo = null;
    var contLobos=ArrayLobos.length;
    var contAldea=ArrayAldea.length;
    var AsesinoVivo=true;

  //contador de gente
    for (var i = 0; i < ArrayMuertos.length; i++) {
      if(ArrayAldea.includes(ArrayMuertos[i]) )
        contAldea--;
      else if(ArrayLobos.includes(ArrayMuertos[i]) )
        contLobos--;
    }
    //esta muerto el asesino?
    if(ArrayMuertos.includes(IdAsesino))
      AsesinoVivo=false;

    //más lobos que aldea  //Si hay 1 y 1 de lobo y aldea
    if(contLobos>contAldea ||(contLobos==contAldea && contAldea==1) ){
      console.log("Comprobando que no hay más lobos que aldea");
      Equipo="Lobos";
    }
    //Están 1 a 1 el lobo y el asesino?
      else if(contAldea==0 && contLobos==1 && (AsesinoVivo==true && IdAsesino != null)){
        console.log("Comprobando que no sea 1 lobo y 1 asesino");
        Equipo="Psicópata";
      }
    //Si hay 1 aldeano y 1 asesino
    else if(contAldea==1 && contLobos==0 &&  (AsesinoVivo==true && IdAsesino != null) ){
      console.log("Comprobando que no sea 1 aldeano y 1 asesino");
      Equipo="Psicópata";
    }
    //Está  1 asesino solo?
    else if(contAldea==0 && contLobos==0 &&  (AsesinoVivo==true && IdAsesino != null) ){
      console.log("Comprobando que no sea el asesino solo");
      Equipo="Psicópata";
    }
    //victoria de aldea?
    else if(contAldea!=0 && contLobos==0 && AsesinoVivo==false ){
      console.log("Comprobando si hay aldeanos y 0 malos");
      Equipo="Aldea";
    }

    if(Equipo != null && EstadoPartida!="Pendiente" && EstadoPartida!= "Asignando")
        io.sockets.emit("PartidaGanada", Equipo);
  }

});

//fin sockets
});



// FUNCIONES ======================================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function revelarRol(Usuario){
  db.collection("usuarios").where("id_usuario", "==", Usuario)
      .get()
      .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
              //Mostramos su rol cuando muere
              var rolvisible = doc.data().rol;
              // Lo matamos
              db.collection("usuarios").doc(doc.id).update({rol_visible: rolvisible});
          });
     });
     setTimeout(function() {
         console.log('Tiempo de espera por seguridad (revelar un rol)');
     }, 200);
}

function MatarUsuario(Usuario){
  db.collection("usuarios").where("id_usuario", "==", Usuario)
    .get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            console.log(doc.id, " => ", doc.data());
            var rolvisible = doc.data().rol;

            // Build doc ref from doc.id
            db.collection("usuarios").doc(doc.id).update({estado: "muerto", rol_visible: rolvisible});
        });
   });

   setTimeout(function() {
       console.log('Tiempo de espera por seguiridad (Matar usuario)');
   }, 200);
}

function sacarNombre(id){
    //Sacamos el nombre de usuario en firebase a partir de la id
    var AuxNombreUsuarioVotado;
    db.collection("usuarios").where("id_usuario", "==", id)
      .get()
      .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
           AuxNombreUsuarioVotado=doc.data().username;
          });
     });

     setTimeout(function() {
         console.log('Tiempo de espera por seguiridad (coger nombre)');
     }, 200);
     return AuxNombreUsuarioVotado;
}

function manejar_estado(){
  if(partidaAcabada==false && EstadoPartida!="Finalizada"){
    var tiempo_espera="";

    if(EstadoPartida=="Pendiente"){
    //empieza la partida tras una espera de unos segundos
    //Si hay 8 jugadores esperaremos 60s
    tiempo_espera = 10000;
    //si hay menos de 10 y mas de 8, 30s
    if(NumUsuarios>8 && NumUsuarios<10)
      tiempo_espera = 10000;
    //si hay más de 10, 10s
    else if (NumUsuarios>10)
      tiempo_espera = 10000;

    console.log("Hay suficientes jugadores para empezar, vamos a cambiar el estado de la partida dentro de "+tiempo_espera/1000+" segundos. Esperamos posibles nuevos jugadores.");
    setTimeout(cambiar_estado,tiempo_espera,"Empezada");
  }
  if(EstadoPartida=="Empezada"){
    //asignar roles
    asignar_roles();
    //contador para empezar la partida. Le pasamos el siguiente estado
    console.log("Cuenta atrás para empezar la partida: ");
    tiempo_espera=8;
    contador(tiempo_espera, "Asignando");
  }

  if(EstadoPartida=="Asignando"){
    tiempo_espera=3;
    contador(tiempo_espera, "Noche");
  }

  if(EstadoPartida=="Noche"){
      //Reiniciamos la cuchillada para el psicópata
      cuchillada=true;

      console.log("Es de noche.");
      console.log("Los lobos votan a un aldeano para morir");
      tiempo_espera=30;

      contador(tiempo_espera, "Dia");
    }

  if (EstadoPartida=="Votaciones") {
      console.log("Es momento de votar a los lobos/ Psicópata");
      console.log("Volverá la noche");
      tiempo_espera=30;

      contador(tiempo_espera, "Noche");
    }

   if (EstadoPartida=="Dia") {
     //Un nuevo día, reiniciamos el array de votos
      ArrayVotos=[];
      console.log("Votos reiniciados");
      console.log("Es de día.");
      console.log("Un par de aldeanos han muerto por el  Psicópata y por los lobos");
      console.log("Es momento de discutir");
      tiempo_espera=30;

      contador(tiempo_espera, "Votaciones");
    }
  }

  if(EstadoPartida=="Finalizada" || partidaAcabada == true){
    console.log("La partida ha acabado<<<<<<<<<<");
    //Borramos los usuarios en esta sala
    //var deleteDoc = db.collection('usuarios').doc(IDPartida).delete();
    //var deleteUsuarios = db.collection('usuarios').doc().delete();
    deleteCollection(db, 'usuarios', 100);

    //La marcamos como finalizada
    var partidaPendiente = db.collection('partida').doc(IDPartida);
    // Set the 'capital' field of the city
    var updateSingle = partidaPendiente.update({estado: "Pendiente"});
  }

  //Hemos acabado, enviamos el estado de la PARTIDA
  io.sockets.emit("estado", EstadoPartida, tiempo_espera);
}



function cambiar_estado(estado){
  EstadoPartida=estado;
  var ref = db.collection("partida").doc(IDPartida);
  ref.update({
      estado: estado
  })
  .then(function() {
    console.log("Recibido cambio de estado: '"+estado+"' en el FB");
    manejar_estado();
  })
  .catch(function(error) {
      // The document probably doesn't exist.
      console.error("Error al actualizar el estado: ", error);
  });
}

function contador(tiempo, SiguienteEstado) {
    if(partidaAcabada==false || EstadoPartida!="Finalizada"){
      var counter = tiempo;
        var interval = setInterval(function() {
        counter--;
        console.log(counter)
        io.sockets.emit("tiempo", counter);
        if (counter == 0) {
            // Display message
            console.log("Contador terminado");
            clearInterval(interval);
            //cambiar_estado(SiguienteEstado);
            if(partidaAcabada!=true && EstadoPartida !="Finalizada"){
              EstadoPartida=SiguienteEstado;
            }
            manejar_estado();          }
      }, 1000);
  }else{
    EstadoPartida="Finalizada";
    console.log("La partida ha acabado.");
  }

}

function deleteCollection(db, collectionPath, batchSize) {
  var collectionRef = db.collection(collectionPath);
  var query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  query.get()
      .then((snapshot) => {
        // When there are no documents left, we are done
        if (snapshot.size == 0) {
          return 0;
        }

        // Delete documents in a batch
        var batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        return batch.commit().then(() => {
          return snapshot.size;
        });
      }).then((numDeleted) => {
        if (numDeleted === 0) {
          resolve();
          return;
        }

        // Recurse on the next process tick, to avoid
        // exploding the stack.
        process.nextTick(() => {
          deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
      })
      .catch(reject);
}

//====ROLES====
//Detallados para cada grupo de jugadores
function asignar_roles(){
  var Roles = [];
  console.log("Asignando roles a los users ! :)");
    /* Si hay 8 jugadores:
      -lobos 2
      -1 vidente
      -Pistolero
      - Psicópata
      -Cura
      -Doctor
      -1 aldeano
    */
  if(NumUsuarios==8) {
    Roles = ["Lobo", "Lobo", "Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Aldeano"];
    shuffle_rols(Roles);
}
  /*
    Si hay 9
    -lobos 3
    -1 vidente
    -Pistolero
    - Psicópata
    -Cura
    -Doctor
    -1 aldeano*/
  else if (NumUsuarios==9) {
    Roles = ["Lobo", "Lobo","Lobo", "Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Aldeano"];
    shuffle_rols(Roles);

  }
  /*
      Si hay 10
      -lobos 3
      -2 videntes
      -Pistolero
      - Psicópata
      -Cura
      -Bufón
      -Doctor
      */
  else if (NumUsuarios==10) {
    Roles = ["Lobo", "Lobo", "Lobo", "Vidente", "Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón"];
    shuffle_rols(Roles);

  }

  /*
      Si hay 11
      -lobos 3
      -2 videntes
      -Pistolero
      - Psicópata
      -Cura
      -Bufón
      -Doctor
      -Guardaespaldas
      */
  else if (NumUsuarios==11) {
    Roles = ["Lobo", "Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas"];
    shuffle_rols(Roles);

  }
  /*
      Si hay 12
      -lobos 4
      -2 videntes
      -Pistolero
      - Psicópata
      -Cura
      -Bufón
      -Doctor
      -Guardaespaldas*/
  else if(NumUsuarios==12){
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas"];
    shuffle_rols(Roles);

  }
  /*
  Si hay 13
  -lobos 4
  -2 videntes
  -Pistolero
  - Psicópata
  -Cura
  -Bufón
  - Doctor
  - Hechicero (revela 1 vez el rol a todos)
  -Guardaespaldas
  */
  else if (NumUsuarios==13) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas", "Hechicero"];
    shuffle_rols(Roles);

  }
  /*
      Si hay +14
        El resto son aldeanos
  */
  else if (NumUsuarios==14) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas", "Hechicero", "Aldeano"];
    shuffle_rols(Roles);

  }
  else if (NumUsuarios==15) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas", "Hechicero", "Aldeano", "Aldeano"];
    shuffle_rols(Roles);

  }
  else if (NumUsuarios==16) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicópata", "Cura", "Doctor", "Bufón", "Guardaespaldas", "Aldeano", "Hechicero", "Aldeano","Aldeano"];
    shuffle_rols(Roles);

  }
  //error
  else
    console.log("Algo ha ido mal. No deberías haber llegado aquí");
}


function shuffle_rols(array){
	//Longitud
  var tamaño = array.length;

  //Por cada jugador
 db.collection("usuarios").where("id_partida", "==",IDPartida)
      .get()
      .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            //Por cada jugador en partida
              //Copiamos el array
              var copia = array;
		   	   //Longitud
			        var tamaño = copia.length;
           // Cogemos el valor aleatorio
              i = Math.floor(Math.random() * tamaño--);
              var rol_tocado = copia[i];
  				//Quitarlo del array
  				array.splice(i,1);
				   //Repetir
	         console.log(rol_tocado+" asignado.");
            var ref = db.collection("usuarios").doc(doc.id);
             return ref.update({
               rol: rol_tocado
             });
           });
       });
      io.sockets.emit("rolesAsignados");
}

// launch ======================================================================
/*server.listen(8080, function() {
  console.log("Servidor corriendo en http://localhost:8080");
});*/
server.listen(3000, function () {
console.log('Listening to port:  ' + 3000);
});
