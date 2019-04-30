//VARIABLES DE INICIO
  //partida
      var estado_partida= "sin_empezar";
      var id_sala = 1;
      //HAY QUE COMPROBAR LA PARTIDA!!!!!!!!!!!!!!!!<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      var id_partida = 1;
  //Datos de usuario
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);


//============PARTIDA===========
      //Si hay cambios en la tabla jugadores, vuelve a comprobar cuantos hay
      db.collection("usuarios").onSnapshot(comprobar_sala(id_sala));
      //Si hay cambios en la tabla jugadores, vuelve a comprobar cuantos hay
      db.collection("partida").onSnapshot(estado);
//==========JUGADORES===========
  //comprobamos si existe el usuario y si no existe lo añade a la partida
      if(comprobar_usuario(userId, username, id_partida)){
            console.log("CHECK: Usuarios controlados");
              }

//======FUNCIONES!!======
function comprobar_sala(partida){
  console.log("COMPROBANDO USUARIOS EN PARTIDA >>>>");
  const cantidad_jugadores = db.collection("usuarios").where("id_partida","==",partida)
         .get().then(function(querySnapshot) {
             console.log("  Hay "+ querySnapshot.size+" jugadores en esta sala!");
             return  querySnapshot.size;
           });

           //si son suficientes
        if (cantidad_jugadores>=8) {
          console.log(" >>>> Hay suficientes jugadores, empezamos");
          //assignación aleatoria de rols y hacer update
          //contador para iniciar
          //fase 1 al final del contador
        }
        else {
          console.log(" >>>> No hay suficientes jugadores, nos esperamos ");
          //sino no hace nada y espera
        }
  //sino no hace nada y espera
}

function assignacion(id_partida){
  //Recoger los usuarios uno por uno y asignarles un rol
}
function contador(id_partida, tiempo){
  //Contador de x segundos para la partida
}

function comprobar_usuario(id_usuario, username, id_partida){
  const comp = db.collection("usuarios").where("id_usuario","==",id_usuario)
         .get().then(function(querySnapshot) {
             const count = querySnapshot.size;
             console.log(count);

             if(count >0){
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
