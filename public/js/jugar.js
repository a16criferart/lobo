//==========VARIABLES===========
  var IDPartida="";

  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);


//============PARTIDA===========
//cargar tablero
  tablero();
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
    if(EstadoPartida=="Pendiente")
    //EXISTIA?
    //SI NO EXISTE LO AÑADIRÁ, SINO NO
          comprobar_usuario(userId, username, IDPartida);
    else {
      check_usuario_sala(userId, IDPartida);
    }
    })


//======FUNCIONES!!======
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
  if(comp)
    console.log("Añadido");
  else
    console.log("Error al añadir");
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
          console.log(doc.id, " => ", doc.data());
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
      
         
      console.table(jugadores)
      //console.log(jugadores[0].avatar);
      $('#partida').append(trHTML);
  })
  .catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}