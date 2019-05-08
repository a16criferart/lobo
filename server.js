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
console.log("El estado actual de la partida es:" +EstadoPartida);

//SNAPSHOTS

  //SNAPSHOT JUGADORES DE LA SALA
    var SnapJugadores =DBJugadores.onSnapshot(llistaJugadors => {
      console.log("SNAPSHOT ===> jugadors");
      var getJugadores = db.collection('usuarios').get()
      .then(usuarios => {
          console.log("En la sala hay:  "+usuarios.size+ " jugadores");
          //Si hay 8 o más y no se ha empezado la partida
          if(usuarios.size>=8){
            console.log(EstadoPartida);
            manejar_estado();
          }
            //bucle
            //noche
            //Contador
            //votaciones
            //noche
            //contador

          //Si no los hay
          else if(usuarios.size<8)
            console.log("Aún no hay suficientes jugadores");
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

        //socket.emit('cambiar_estado_partida', {text:estado_partida});

    }, err => {
      console.log(`Encountered error: ${err}`);
    });


//SOCKET
var server = require('http').Server(app);
var io = require('socket.io')(server);


io.on('connection', function(socket) {
  console.log('Alguien se ha conectado con Sockets');
  socket.emit('hola', EstadoPartida, IDPartida);

});



// launch ======================================================================
server.listen(8080, function() {
  console.log("Servidor corriendo en http://localhost:8080");
});

// FUNCIONES ======================================================================
function manejar_estado(){

  if(EstadoPartida=="Pendiente"){
  console.log("Hay suficientes jugadores para empezar, vamos a cambiar el estado de la partida");
  //empieza la partida
  cambiar_estado(EstadoPartida="Empezada");
  if(EstadoPartida=="Empezada"){
    //asignar roles
    //contador para empezar la partida. Le pasamos el siguiente estado
    console.log("Cuenta atrás para empezar la partida: ");
    contador(10, "Noche");
  }
}

  if(EstadoPartida=="Noche"){
    console.log("Es de noche.");
    console.log("Los lobos votan a un aldeano para morir");

    contador(10, "Dia");
  }
  if (EstadoPartida=="Votaciones") {
    console.log("Es momento de votar a los lobos/asesino");
    console.log("Volverá la noche");

    contador(10, "Noche");
  }
 if (EstadoPartida=="Dia") {
    console.log("Es de día.");
    console.log("Un par de aldeanos han muerto por el asesino y por los lobos");
    console.log("Es momento de discutir");

    contador(10, "Votaciones");
  }

}
function cambiar_estado(estado){
  var ref = db.collection("partida").doc(IDPartida);
  ref.update({
      estado: estado
  })
  .then(function() {
    console.log("Recibido cambio de estado: '"+estado+"' en el FB");
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

/*
function comprobar_sala(){
  get_estado();
  console.log("===Sala===");
  console.log("¿¿Partida empezada??");
  if(estado_partida=="sin_empezar"){
    console.log("Sin empezar!");
    console.log("COMPROBANDO SALA  >>>>");
    const cantidad_jugadores = db.collection("usuarios").where("id_partida","==",id_partida)
         .get().then(function(querySnapshot) {
             console.log("  Hay "+ querySnapshot.size+" jugadores en esta sala!");
             return  querySnapshot.size;
           });

           //si son suficientes
        if (cantidad_jugadores>=8) {
          console.log(" >>>> Hay suficientes jugadores, empezamos");
          //assignación aleatoria de rols y hacer update
          assignacion(id_partida);
          //contador para iniciar
          //fase 1 al final del contador
        }
        else {
          console.log(" >>>> No hay suficientes jugadores, nos esperamos ");
          //sino no hace nada y espera
        }
      }
    else
      console.log("La partida ya ha empezado");
}




  function assignacion(id_partida){
    console.log("===ROLES===");
    console.log("Asignando roles a los users ! :)");
    //Recoger los usuarios uno por uno y asignarles un rol
    db.collection("usuarios").where("id_partida", "==", id_partida)
      .get()
      .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
                  var ref = db.collection("usuarios").doc(doc.id);

                  return ref.update({
                      rol: ":D"
                  });
              });
          });
        console.log("Roles asignados, cambiando estado");
        cambiar_estado("roles");
  }

    socket.on('cambiar_estado_partida', function(estado) {
      console.log("El servidor ha recibido un cambio en la partida");
      console.log("El estado de la partida es :" + estado.text);

      if(estado.text=="sin_empezar")
        console.log("La partida aún no ha empezado");
      else if (estado.text == "contador") {
        contador();
      }
      else if (estado.text=="acabada") {
        console.log("La partida ha acabado");
      }
    });

*/
