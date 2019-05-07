//==========VARIABLES===========

  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);


//============PARTIDA===========
    // HA ENTRADO UN JUGADOR
      //EXISTIA?
      comprobar_usuario(userId, username, id_partida);
      //SI NO EXISTE LO AÑADIRÁ, SINO NO


//======= FUNCIONES SOCKET =====

//Conexión al servidor
var socket = io.connect('http://localhost:8080', { 'forceNew': true });
//

socket.on('hola', function() {
  console.log("El servidor ha recibido al usuario "+userId);
  })


//======FUNCIONES!!======
function comprobar_usuario(id_usuario, username, id_partida){
  console.log("===Usuario===");
  const comp = db.collection("usuarios").where("id_usuario","==",id_usuario)
         .get().then(function(querySnapshot) {
             if(querySnapshot.size > 0){
               console.log("El usuario ya existe en la partida");
               console.log("No se va a añadir");
             }
             else{
               console.log("El usuario no existia en la partida");
               añadir_jugador(id_usuario,username,id_partida )
             }
         })
  }

function añadir_jugador (userId, username, id_partida) {
  const comp = db.collection("usuarios").add({
    id_usuario: userId,
    username: username,
    estado: "vivo",
    id_partida : id_partida,
    rol: null,
    rol_visible: "Aldeano",
    votos:null,
    avatar: "https://minecraftcommand.science/images/villager/farmer.png"
  });
  if(comp)
    console.log("Añadido");
  else
    console.log("Error al añadir");
}

//==============================

}



/*
function ciclo() {
    fase1();

    setTimeout( fase1, 15000);
}

function fase1() {
    contador();
    console.log ("FASE 1");
    //setTimeout(fase2, 5000);
    return setTimeout(fase2, 5000);
}
function fase2() {
    contador();
    console.log ("FASE 2");
    return setTimeout(fase3, 5000);
}
function fase3() {
    contador();
    console.log ("FASE 3");
    return setTimeout(fase1, 5000);
}
function contador() {

    var counter = 5;
    var interval = setInterval(function() {
    counter--;
    console.log(counter)
    if (counter == 0) {
        // Display message
        clearInterval(interval);
    }
}, 1000);
}

function pre_contador() {

var counter = 15;
var interval = setInterval(function() {
counter--;
console.log(counter)
if (counter == 0) {
    // Display message
    clearInterval(interval);
    }
}, 1000);
}*/
