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

var server = require('http').Server(app);
var io = require('socket.io')(server);



io.on('connection', function(socket) {
  console.log('Alguien se ha conectado con Sockets');
  socket.emit('test');

  socket.on('cambiar_estado_partida', function(estado) {
    console.log("El servidor ha recibido un cambio en la partida");
    console.log("El estado de la partida es :" +estado.text);

    if(estado.text=="sin_empezar")
      console.log("La partida aún no ha empezado");
    else if (estado.text == "contador") {
      contador();
    }
    else if (estado.text=="acabada") {
      console.log("La partida ha acabado");
    }
  });
});



// launch ======================================================================
server.listen(8080, function() {
  console.log("Servidor corriendo en http://localhost:8080");
});

// h ======================================================================
function contador() {

    var counter = 5;
    var interval = setInterval(function() {
    counter--;
    console.log(counter)
    if (counter == 0) {
        // Display message
        console.log("Contador terminado");
        clearInterval(interval);
    }
}, 1000);
}
