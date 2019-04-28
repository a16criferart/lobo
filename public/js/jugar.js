//VARIABLES DE INICIO
  //partida
      var estado_partida= "sinempezar";
      var id_sala = 1;
      //HAY QUE COMPROBAR LA PARTIDA!!!!!!!!!!!!!!!!<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      var id_partida = 1;
  //Datos de usuario
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);

  window.onload = function() {
    //comprobamos si existe el usuario y si no existe lo añade a la partida
        comprobar_usuario(userId);
  };

function comprobar_usuario(id_usuario){
  const ref = db.ref("jugadores");
  const count = ref.orderByKey().equalTo(id_usuario);
  console.log(count);
  if(count != null)
    console.log("El usuario ya existe en la partida");
  else
    añadir_jugador(userId, username, id_partida);
}
  /*ref.child(id_usuario).on('value', function (snapshot) {
       //snapshot would have list of NODES that satisfies the condition
  var count =snapshot.val()
	console.log("Se han encontrado " + snapshot.val() + " coincidencias");

  if(count >0)
    console.log("El usuario ya existe en la partida");
  else
    añadir_jugador(userId, username, id_partida);
  });
}
*/


function añadir_jugador (userId, username, id_partida) {
  firebase.database().ref('jugadores  /' + userId).set({
    id_usuario: userId,
    username: username,
    estado: "vivo",
    id_partida : id_partida,
    rol: null,
    avatar: "https://minecraftcommand.science/images/villager/farmer.png"
  }, function(error) {
    if (error) {
      // The write failed...
      console.log("Algo ha ido mal y el usuario no se ha añadido a la partida");
      console.log(error);
    } else {
      // Data saved successfully!
      console.log("Usuario añadido a la partida!");
      //comprobar el numero de jugadores en la sala
      //si son suficientes
        //assignación aleatoria de rols y hacer update
        //contador para iniciar
        //fase 1
      //sino no hace nada y espera
    }
  });
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
