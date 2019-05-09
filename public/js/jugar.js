//==========VARIABLES===========
  var IDPartida="";

  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);
      var rol = null;

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
      //cargamos el tablero a usuarios reconectados
      tablero();
    }

  })

//==============CODIGO DE PARTIDA================
  socket.on("estado", function(EstadoPartida, tiempo){
    var Info = document.getElementById('InfoPartida');
    //actualizamos tablero por si hay cambios
    tablero();
    //Comprobamos los roles en todos los casos menos en empezar, que es cuando se asignan
    if(EstadoPartida!="Empezada")
      coger_rol();

    console.log("¡LA PARTIDA HA TENIDO UN CAMBIO DE ESTADO!");
    console.log(EstadoPartida);


    if(EstadoPartida=="Empezada"){
      //contador para empezar la partida. Le pasamos el siguiente estado
      console.log("Cuenta atrás para empezar la partida. aprox:"+tiempo+" segundos");
      Info.innerHTML = "Cuenta atrás para empezar la partida. <div id='segundos'><br>Tiempo: 0 segundos</div>";

    }
      if(EstadoPartida=="Noche"){
        console.log("Es de noche.");
        console.log("Los lobos votan a un aldeano para morir");
        Info.innerHTML = ("Es de noche. Los lobos votan a un aldeano para morir.  <div id='segundos'><br>Tiempo: 0 segundos</div>");

      }
      if (EstadoPartida=="Votaciones") {
        console.log("Es momento de votar a los lobos/ Psicopata");
        console.log("Volverá la noche");
        Info.innerHTML = ("Es momento de votar a los lobos/ Psicopata. Volverá la noche pronto.  <div id='segundos'><br>Tiempo: 0 segundos</div>") ;

      }
     if (EstadoPartida=="Dia") {
        console.log("Es de día.");
        console.log("Un par de aldeanos han muerto por el  Psicopata y por los lobos");
        console.log("Es momento de discutir");
        Info.innerHTML = ("Es de día. Es momento de discutir quién es malo.  <div id='segundos'><br>Tiempo: 0 segundos</div>" ) ;

      }

  });

  socket.on("rolesAsignados", function(){
    //cogemos el rol del usuario ahora por si se ha conectado tarde
    coger_rol();
  });

  socket.on('tiempo', function(segundos) {
    var TiempoPartida = document.getElementById('segundos');

    console.log(segundos);
    TiempoPartida.innerHTML = " <br>Tiempo:</b><i> "+segundos+" segundos</i>";
  });

//======FUNCIONES!!======

function coger_rol(){
  db.collection("usuarios").where("id_usuario","==",userId)
  .get()
  .then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
      rol= doc.data().rol;
      console.log(rol);
    })
  });

}

function comprobar_usuario(id_usuario, username, IDPartida){
  console.log("===Usuario===");
  const comp = db.collection("usuarios").where("id_usuario","==",id_usuario)
         .get().then(function(querySnapshot) {
             if(querySnapshot.size > 0){
               console.log("El usuario ya existe en la partida");
               console.log("No se va a añadir");
             }
             else{
               console.log("El usuario no existia en la partida");
               añadir_jugador(id_usuario,username,IDPartida )
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
    tablero();
  }
  else{
    console.log("Error al añadir");
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
