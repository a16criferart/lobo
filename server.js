// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
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
             //CARGAR TABLERO
             io.sockets.emit("ActualizarTablero");
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
var ArrayVotos = [];
var ArrayMuertos= [];
var AuxNombreUsuarioVotado;
var AuxNombreMasVotado;
var CopiaAuxMasVotado;
//roles
var ObjetivoRol=null;
var NombreUsuarioRol=null;
var BalasRestantes=2;

//===SOCKET===
io.on('connection', function(socket) {
  socket.emit('hola', EstadoPartida);

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
//pistolero
socket.on("Balas", function(userId, UsuarioVotado){
  if(BalasRestantes>0){
    //el pistolero aun tiene balas.
    //disparamos
    db.collection("usuarios").where("id_usuario", "==", UsuarioVotado)
        .get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                //Mostramos su rol cuando muere
                var rolvisible = doc.data().rol;
                // Lo matamos
                db.collection("usuarios").doc(doc.id).update({estado: "muerto", rol_visible: rolvisible});
            });
       });
       //Añadimos al muerto
       ArrayMuertos.push(UsuarioVotado);
      //Cogemos el nombre del usuario disparado
      sacarNombre(UsuarioVotado);
      ObjetivoRol=AuxNombreUsuarioVotado;
      //Cogemos el nombre del usuario que dispara
       sacarNombre(userId);
       NombreUsuarioRol=AuxNombreUsuarioVotado;
       //Dejamos la var en null
       AuxNombreUsuarioVotado=null;
       //Si hay algun objetivo
         if(ObjetivoRol!=null){
             //Estructuramos el mensaje
             var texto ="<i>El pistolero <b>"+NombreUsuarioRol+"</b> ha disparado a <b>"+ObjetivoRol+" </b></i>";
             var msj = {
               author: "- Servidor -",
               text: texto
             }
             //Enviamos el mensaje por chat
             messages.push(msj);
             io.sockets.emit('messages', messages);
             //Reiniciamos la variable de AuxNombreUsuarioVotado
             AuxNombreUsuarioVotado="";
         }
    //La pistola hace mucho ruido... Revelamos su rol
    db.collection("usuarios").where("id_usuario", "==", userId)
        .get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                //Mostramos su rol cuando muere
                var rolvisible = doc.data().rol;
                // Lo matamos
                db.collection("usuarios").doc(doc.id).update({rol_visible: rolvisible});
            });
       });
       io.sockets.emit("ActualizarTablero");
       //le quitamos una bala
       BalasRestantes--;
  }
  else
    //No ha ido bien o de forma esperada.
    socket.emit("ErrorPistolero");

});

//========Votaciones=======
  socket.on("voto", function(UsuarioVotado, userId, username) {
    var ArrayVotos = [];
    var muerto = false;
    //Si es hora de votar actua:
    if(ArrayMuertos.includes(UsuarioVotado) )
      muerto = true;

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
      sacarNombre(UsuarioVotado);
      if(AuxNombreUsuarioVotado!=null){
          //Estructuramos el mensaje
          var texto ="<i>El usuario <b>"+username+"</b> ha votado a <b>"+AuxNombreUsuarioVotado+" </b></i>";
          var msj = {
            author: "- Servidor -",
            text: texto
          }
          //Enviamos el mensaje por chat
          messages.push(msj);
          io.sockets.emit('messages', messages);
          //Reiniciamos la variable de AuxNombreUsuarioVotado
          AuxNombreUsuarioVotado="";
      }
    }
  });

  //CONTROL DE MUERTOS
    //Más votado
    socket.on("MasVotado", function(MasVotado, MasVotos){
      var UsuarioVotado=" "+MasVotado;
      //Cambiamos su estado vivo ---> muerto
      db.collection("usuarios").where("id_usuario", "==", MasVotado)
        .get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                console.log(doc.id, " => ", doc.data());
                var rolvisible = doc.data().rol;

                // Build doc ref from doc.id
                db.collection("usuarios").doc(doc.id).update({estado: "muerto", rol_visible: rolvisible});
            });
       });
       //Añadimos al muerto
       ArrayMuertos.push(MasVotado);
       //Log en el servidor
      console.log("Se ha matado al usuario "+UsuarioVotado+" con "+MasVotos+" votos.");

      //Sacamos el usuario
      sacarNombre(MasVotado);
      AuxNombreMasVotado=AuxNombreUsuarioVotado;
      AuxNombreUsuarioVotado=null;
      //Si alguien ha sido linchado...
      if(AuxNombreMasVotado!=null && AuxNombreMasVotado!=CopiaAuxMasVotado){
        //Mensaje en el chat
        var msj = {
          author: "- Servidor -",
          text: "<h5><b>"+AuxNombreMasVotado +" ha sido linchado hoy.</h5></b>"
        }
        //Enviamos el mensaje por chat
        messages.push(msj);
        io.sockets.emit('messages', messages);
        //Reiniciamos la variable de AuxNombreUsuarioVotado
        AuxNombreUsuarioVotado="";
        //Guardamos el ultimo linchado
        CopiaAuxMasVotado=AuxNombreMasVotado;
      }


    });

    //========ROLES==========



});



// FUNCIONES ======================================================================
function sacarNombre(id){
    //Sacamos el nombre de usuario en firebase a partir de la id
    db.collection("usuarios").where("id_usuario", "==", id)
      .get()
      .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
           AuxNombreUsuarioVotado=doc.data().username;
          });
     });
}

function manejar_estado(){
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
    console.log("Es de noche.");
    console.log("Los lobos votan a un aldeano para morir");
    tiempo_espera=10;

    contador(tiempo_espera, "Dia");
  }
  if (EstadoPartida=="Votaciones") {
    console.log("Es momento de votar a los lobos/ Psicopata");
    console.log("Volverá la noche");
    tiempo_espera=10;

    contador(tiempo_espera, "Noche");
  }
 if (EstadoPartida=="Dia") {
   //Un nuevo día, reiniciamos el array de votos
    ArrayVotos=[];
    console.log("Votos reiniciados");
    console.log("Es de día.");
    console.log("Un par de aldeanos han muerto por el  Psicopata y por los lobos");
    console.log("Es momento de discutir");
    tiempo_espera=10;

    contador(tiempo_espera, "Votaciones");
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
          EstadoPartida=SiguienteEstado;
          manejar_estado();
      }
  }, 1000);
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
      - Psicopata
      -Cura
      -Doctor
      -1 aldeano
    */
  if(NumUsuarios==8) {
    Roles = ["Lobo", "Lobo", "Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Aldeano"];
    shuffle_rols(Roles);
}
  /*
    Si hay 9
    -lobos 3
    -1 vidente
    -Pistolero
    - Psicopata
    -Cura
    -Doctor
    -1 aldeano*/
  else if (NumUsuarios==9) {
    Roles = ["Lobo", "Lobo","Lobo", "Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Aldeano"];
    shuffle_rols(Roles);

  }
  /*
      Si hay 10
      -lobos 3
      -2 videntes
      -Pistolero
      - Psicopata
      -Cura
      -Bufon
      -Doctor
      */
  else if (NumUsuarios==10) {
    Roles = ["Lobo", "Lobo", "Lobo", "Vidente", "Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon"];
    shuffle_rols(Roles);

  }

  /*
      Si hay 11
      -lobos 3
      -2 videntes
      -Pistolero
      - Psicopata
      -Cura
      -Bufon
      -Doctor
      -Guardaespaldas
      */
  else if (NumUsuarios==11) {
    Roles = ["Lobo", "Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas"];
    shuffle_rols(Roles);

  }
  /*
      Si hay 12
      -lobos 4
      -2 videntes
      -Pistolero
      - Psicopata
      -Cura
      -Bufon
      -Doctor
      -Guardaespaldas*/
  else if(NumUsuarios==12){
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas"];
    shuffle_rols(Roles);

  }
  /*
  Si hay 13
  -lobos 4
  -2 videntes
  -Pistolero
  - Psicopata
  -Cura
  -bufon
  - Doctor
  - Hechicero (revela 1 vez el rol a todos)
  -Guardaespaldas
  */
  else if (NumUsuarios==13) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas", "Hechicero"];
    shuffle_rols(Roles);

  }
  /*
      Si hay +14
        El resto son aldeanos
  */
  else if (NumUsuarios==14) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas", "Hechicero", "Aldeano"];
    shuffle_rols(Roles);

  }
  else if (NumUsuarios==15) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas", "Hechicero", "Aldeano", "Aldeano"];
    shuffle_rols(Roles);

  }
  else if (NumUsuarios==16) {
    Roles = ["Lobo", "Lobo","Lobo", "Lobo", "Vidente","Vidente", "Pistolero", "Psicopata", "Cura", "Doctor", "Bufon", "Guardaespaldas", "Aldeano", "Hechicero", "Aldeano","Aldeano"];
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
server.listen(8080, function() {
  console.log("Servidor corriendo en http://localhost:8080");
});
