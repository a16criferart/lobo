//==========VARIABLES===========
  var IDPartida="";
  var cliente = false;

  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);


//============PARTIDA===========
  //======= FUNCIONES SOCKET =====

  //Conexión al servidor
  var socket = io.connect('http://localhost:8080', { 'forceNew': true });
  //

  // HA ENTRADO UN JUGADOR
  socket.on('hola', function(EstadoPartida, id_partida) {
    console.log("El servidor ha recibido al usuario "+userId);
    //EL ESTADO DE LA PARTIDA?
    console.log("El estado de la partida es:  "+EstadoPartida);
    IDPartida=id_partida;
    //SI  LA PARTIDA ESTÁ SIN EMPEZAR, LE DEJAMOS ENTRAR
    if(EstadoPartida=="Pendiente"){
    //EXISTIA?
    //SI NO EXISTE LO AÑADIRÁ, SINO NO
      comprobar_usuario(userId, username, IDPartida);

    }
    else {
      check_usuario_sala(userId, IDPartida);
      socket.emit("recibido", {valor:cliente});
    }

  })
  socket.on("estado", function(EstadoPartida, tiempo){
    var Info = document.getElementById('InfoPartida');
    Info.innerHTML = "Hay un cambio";

    console.log("¡LA PARTIDA HA TENIDO UN CAMBIO DE ESTADO!");
    console.log(EstadoPartida);

    if(EstadoPartida=="Empezada"){
      //contador para empezar la partida. Le pasamos el siguiente estado
      console.log("Cuenta atrás para empezar la partida. aprox:"+tiempo+" segundos");
      Info.innerHTML = "Cuenta atrás para empezar la partida. aprox:"+tiempo+" segundos";

    }
      if(EstadoPartida=="Noche"){
        console.log("Es de noche.");
        console.log("Los lobos votan a un aldeano para morir");
        Info.innerHTML = ("Es de noche. Los lobos votan a un aldeano para morir");

      }
      if (EstadoPartida=="Votaciones") {
        console.log("Es momento de votar a los lobos/ Psicopata");
        console.log("Volverá la noche");
        Info.innerHTML = ("Es momento de votar a los lobos/ Psicopata.Volverá la noche en aprox:"+tiempo+" segundos") ;

      }
     if (EstadoPartida=="Dia") {
        console.log("Es de día.");
        console.log("Un par de aldeanos han muerto por el  Psicopata y por los lobos");
        console.log("Es momento de discutir");
        Info.innerHTML = ("Es de día. Un par de aldeanos han muerto por el  Psicopata y por los lobos.Es momento de discutir" ) ;

      }

  });

//======FUNCIONES!!======
function comprobar_usuario(id_usuario, username, IDPartida){
  console.log("===Usuario===");
  const comp = db.collection("usuarios").where("id_usuario","==",id_usuario)
         .get().then(function(querySnapshot) {
             if(querySnapshot.size > 0){
               console.log("El usuario ya existe en la partida");
               console.log("No se va a añadir");
               cliente= false;
                       socket.emit("recibido", {valor:cliente});
             }
             else{
               console.log("El usuario no existia en la partida");
               añadir_jugador(id_usuario,username,IDPartida )
               cliente=true;
                       socket.emit("recibido", {valor:cliente});
             }
         })
  }
function check_usuario_sala(id_usuario, IDPartida){
  const comp = db.collection("usuarios").where("id_usuario","==",id_usuario)
         .get().then(function(querySnapshot) {
             if(querySnapshot.size > 0){
               alert("Procura no volver a salir de una partida en curso!!")
             }
             else{
              alert("La partida ya ha empezado, no puedes unirte");
              setTimeout(4000,  location.href ="/perfil");
             }
         })
}

function añadir_jugador (userId, username, IDPartida) {
  const comp = db.collection("usuarios").add({
    id_usuario: userId,
    username: username,
    estado: "vivo",
    id_partida : IDPartida,
    rol: null,
    rol_visible: "Aldeano",
    votos:null,
    avatar: "https://minecraftcommand.science/images/villager/farmer.png"
  });
  if(comp){
    console.log("Añadido");
    cliente=true;
  }
  else{
    console.log("Error al añadir");
    cliente=false;
  }
}

function tablero(){


  var docRef = db.collection("usuarios");
  var jugadores = [];
  var avatares = [];
  var trHTML = '<tr>';
  var cont=0;
  $('#partida').empty();
  db.collection("usuarios")
  .get()
  .then(function(querySnapshot) {


      querySnapshot.forEach(function(doc) {
          cont++;
          // doc.data() is never undefined for query doc snapshots
          //console.log(doc.id, " => ", doc.data());
          //jugadores.push(doc.data());
          trHTML += '<td><img class="avatar" src="'+ doc.data().avatar +'" alt="Avatar">'
              + '<div class="username"><b>' + doc.data().username + '</b>(3)</div>'
              + '<div class="rol">' + doc.data().rol+ '</div>'+ '</td>';

          if (cont==4){
              trHTML += '<tr>'
              cont=0;
          }
          //console.log(doc.data().avatar)

      });


      //console.log(jugadores[0].avatar);
      $('#partida').append(trHTML);
  })
  .catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}

//cargar tablero
  tablero();
