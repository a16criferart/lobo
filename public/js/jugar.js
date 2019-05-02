//==========VARIABLES===========


  //partida
      var estado_partida;
      var id_sala = "phk5QBx6nefQHBrePDAz";
      //HAY QUE COMPROBAR LA PARTIDA!!!!!!!!!!!!!!!!<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      var id_partida = "avKFrF5ZFS9OxrJDgAy3";
  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);



//==========JUGADORES===========
      comprobar_usuario(userId, username, id_partida);

//============PARTIDA===========
      //Si hay cambios en la tabla jugadores, vuelve a comprobar cuantos hay
      db.collection("usuarios").onSnapshot(comprobar_sala);
      //Si hay cambios en la tabla jugadores, vuelve a comprobar cuantos hay
      db.collection("partida").onSnapshot(cambiar_estado_partida);

//======= FUNCIONES SOCKET =====

function get_estado(){
  //Contador de x segundos para la partida
  const comp = db.collection("partida").where("id_partida","==",id_partida).get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        console.log(" => ", doc.data().estado );
        estado_partida=doc.data().estado;
        return estado_partida;
    });

});
}
//Conexión al servidor
var socket = io.connect('http://localhost:8080', { 'forceNew': true });
//

socket.on('test', function() {
  console.log("El servidor ha recibido al usuario "+userId);
  })

function cambiar_estado_partida() {
  const comp = db.collection("partida").where("id_partida","==",id_partida).get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        console.log(" => ", doc.data().estado );
        estado_partida=doc.data().estado;

        socket.emit('cambiar_estado_partida', {text:estado_partida});
      });
    });
  }
//======FUNCIONES!!======


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

function cambiar_estado(estado){
  var ref = db.collection("partida").doc(id_partida);
  return ref.update({
      estado: estado
  })
  .then(function() {
    console.log("Estado cambiado");
  })
  .catch(function(error) {
      // The document probably doesn't exist.
      console.error("Error al actualizar el estado: ", error);
  });

}


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
    avatar: "https://minecraftcommand.science/images/villager/farmer.png"
  });
  if(comp)
    console.log("Añadido");
  else
    console.log("Error al añadir");
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
