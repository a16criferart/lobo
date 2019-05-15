//==========VARIABLES===========
  var IDPartida="";
  var estado="";

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
    estado = EstadoPartida;
  $('#ContadorVotos').hide();
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
        $("body").attr('class', 'noche');
        Info.innerHTML = ("Es de noche. Los lobos votan a un aldeano para morir.  <div id='segundos'><br>Tiempo: 0 segundos</div>");
        console.log(rol);
        if (rol=="Lobo"){
        $( "#chat_dia" ).hide();
        $( "#chat_noche" ).show();
        };
        
      }
      if (EstadoPartida=="Votaciones") {
        console.log("Es momento de votar a los lobos/ Psicopata");
        console.log("Volverá la noche");
        Info.innerHTML = ("Es momento de votar a los lobos/ Psicopata. Volverá la noche pronto.  <div id='segundos'><br>Tiempo: 0 segundos</div>") ;
        //==votaciones==
        $('#ContadorVotos').show();

      }
     if (EstadoPartida=="Dia") {
        console.log("Es de día.");
        console.log("Un par de aldeanos han muerto por el  Psicopata y por los lobos");
        console.log("Es momento de discutir");
        $("body").attr('class', 'dia');
        Info.innerHTML = ("Es de día. Es momento de discutir quién es malo.  <div id='segundos'><br>Tiempo: 0 segundos</div>" ) ;
        if (rol=="Lobo"){
        $( "#chat_noche" ).hide();
        $( "#chat_dia" ).show();
        }
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

  socket.on('VotoRecibido', function(UsuarioVotado, userId, Votos){
    var Contador=document.getElementById(UsuarioVotado).textContent;
    document.getElementById(UsuarioVotado).textContent= Votos;
    console.log("Voto:"+Votos);
  });
//======FUNCIONES!!======
var UsuarioVotado = " ";
function votar(e){
    UsuarioVotado= e.getAttribute("value") ;
    console.log("Has seleccionado "+ UsuarioVotado+" para votar");
    socket.emit("voto", UsuarioVotado, userId);

}


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
    avatar: "http://i66.tinypic.com/10ctdhh.jpg"
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
          trHTML += '<td id="TDvillager" onclick="votar(this)" value="'+doc.data().id_usuario+'" ><img class="avatar" src="'+ doc.data().avatar +'" alt="Avatar">'
              + '<div class="username"><b>' + doc.data().username + '</b> </div>'
              + '<div id="ContadorVotos"  style="color:red; font-weight:bold; margin-left:50px" >Votos: <span id="'+doc.data().id_usuario+'" value="0">0</span> </div>'
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

  //chat DIA
  function autoscroll(){
    var objDiv = document.getElementById("messages");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
  socket.on('messages', function(data) {
    render(data);
    autoscroll();
  })

  function render (data) {
    var html = data.map(function(elem, index) {
      return(`<div>
                <strong>${elem.author}</strong>:
                <em>${elem.text}</em>
              </div>`);
    }).join(" ");

    document.getElementById('messages').innerHTML = html;
    $('#texto').val('');
  }

  function addMessage(e) {
    var message = {
      author: username,
      text: document.getElementById('texto').value
    };
    message.text = $.trim(message.text);
    
    if (message.text!="" && estado!="Noche"){

    socket.emit('new-message', message);
    }
    return false;
  }

   //chat NOCHE 
   
   function autoscroll(){
    var objDiv = document.getElementById("messagesN");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
  socket.on('messagesN', function(data) {
    renderN(data);
    autoscroll();
  })
  
  function renderN (data) {
    var html = data.map(function(elem, index) {
      return(`<div>
                <strong>${elem.author}</strong>:
                <em>${elem.text}</em>
              </div>`);
    }).join(" ");
  
    document.getElementById('messagesN').innerHTML = html;
    $('#textoN').val('');
  }
  
  function addMessageN(e) {
    var messageN = {
      author: username,
      text: document.getElementById('textoN').value
    };
    messageN.text = $.trim(messageN.text);
    
    if (messageN.text!="" && rol=="Lobo" && estado=="Noche"){

    socket.emit('new-messageN', messageN);
    }
    return false;
  }
  
  
