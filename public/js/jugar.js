//==========VARIABLES===========
  var IDPartida=  "avKFrF5ZFS9OxrJDgAy3";
  var estado="";

  //Datos de usuario
      console.log("===DATOS===");
      const userId= $('#userid').text();
      console.log("id: "+userId);
      var username= $('#username').text();
      console.log("usuario: "+username);
      var genero= $('#sexo').text();
      console.log("Genero: "+genero);
      var rol = null;
      var UsuarioVotado = "";
      let MasVotos=0;
      let MasVotado=null;
      var avisoMuerte=false;
      var Muerte = false;
      var accion = false;
      var accionVidente = false;

  //======= FUNCIONES SOCKET =====

  //Conexión al servidor
  var socket = io.connect('http://localhost:8080', { 'forceNew': true });
  //

  // HA ENTRADO UN JUGADOR
  socket.on('hola', function(EstadoPartida) {
    console.log("El servidor ha recibido al usuario "+userId);
    //EL ESTADO DE LA PARTIDA?
    console.log("El estado de la partida es:  "+EstadoPartida);
    //SI  LA PARTIDA ESTÁ SIN EMPEZAR, LE DEJAMOS ENTRAR
    if(EstadoPartida=="Pendiente"){
    //EXISTIA?
    //SI NO EXISTE LO AÑADIRÁ, SINO NO
      comprobar_usuario(userId, username, IDPartida);

    }
    else {
      check_usuario_sala(userId, IDPartida);
      //cargamos el tablero a usuarios reconectados
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
      Info.innerHTML = "Cuenta atrás para empezar asignar los roles y comenzar. <div id='segundos'><br>Tiempo: 0 segundos</div>";

    }
    if(EstadoPartida=="Asignando"){
      //contador para empezar la partida. Le pasamos el siguiente estado
      console.log("Asignando roles...");
      Info.innerHTML = "Cuenta atrás para empezar la partida. <div id='segundos'><br>Tiempo: 0 segundos</div>";
      cargar_accion();
      accionVidente=true;
    }
      if(EstadoPartida=="Noche"){
        socket.emit("MasVotado", MasVotado, MasVotos);

        console.log("Es de noche.");
        console.log("Los lobos votan a un aldeano para morir");

        //Comprobamos si somos nosotros quienes hemos muerto y si no hemos
        //avisado antes
        if(MasVotado==userId && avisoMuerte == false){
          Muerte = true;
          avisoMuerte=true;
          Swal.fire({
              title: '<h1><strong>Oof!</strong></h1>',
              html:
                '<img src="/img/muerte.jpg" alt="Muerto" width="150px" height="170px"></img><br> ' +
                'Has muerto...',
              confirmButtonText:
                '<i class="fa fa-thumbs-up"></i> Great!',
              confirmButtonAriaLabel: 'Thumbs up, great!',
              cancelButtonText:
                '<i class="fa fa-thumbs-down"></i>',
              cancelButtonAriaLabel: 'Thumbs down',
            });
        }

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
  socket.on("ActualizarTablero", function(){
    //El servidor pide actualizar el tablero
    tablero();
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

  //El servidor ha recibido un voto
  socket.on('VotoRecibido', function(ArrayVotos){
    let result=contarFreq(ArrayVotos);
    //Ponemos los contadores a 0
    $('span').text("0");

    for (var i = 0; i < result.length; i++) {
        var UsuarioVotado= result[0][i];
        console.log("EL ID" + result[0][i]);
        console.log("NUMERO DE VOTOS" + result[1][i]);
        var NumVotos = result[1][i];
        var selecSpan = eliminarEspacios(UsuarioVotado);
        $('#'+selecSpan).text(NumVotos);
        if(NumVotos>MasVotos){
          MasVotos= NumVotos;
          MasVotado = UsuarioVotado;
        }
    }
  });
//======FUNCIONES!!======

function contarFreq(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }

    return [a, b];
}

function votar(e){
  //Cogemos el usuario votado
    UsuarioVotado= e.getAttribute("value") ;
    //console.log("Has seleccionado "+ UsuarioVotado+" para votar");
    //Acciones de rol
    if (UsuarioVotado != userId && Muerte==false && accion==true){
      if(rol=="Vidente" && estado=="Noche")
        accion_rol();
      else if(rol=="Pistolero" || rol=="Cura" && estado!="Noche")
        accion_rol();
    }
    //Esta muerto?
    if(Muerte==false){
      //Nos estamos votando a nosotros mismos?
      if(UsuarioVotado != userId)
      //Se puede votar?
        if(estado=="Votaciones")
        //Enviamos el voto al servidor
          socket.emit("voto", UsuarioVotado, userId, username);
        //Alertas de error vvv
      else
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'No puedes votarte a ti mismo'
        })
    }
    else
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: '¿Estás intentando votar estando muerto?'
      })
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
              querySnapshot.forEach(function(doc) {
                rol= doc.data().rol;
                cargar_accion();
              });
               //alert("Procura no volver a salir de una partida en curso!!")
               Swal.fire({
                    title: '<strong>¡Aviso!</strong>',
                    type: 'warning',
                    html:
                      'No vuelvas a salir de una partida en curso.',
                    confirmButtonText:
                      '<i class="fa fa-thumbs-up"></i> ¡No volverá a ocurrir!',
                    confirmButtonAriaLabel: '¡No volverá a ocurrir!'
                  })
             }
             else{
              //alert("La partida ya ha empezado, no puedes unirte");
              Swal.fire({
                   title: '<strong>Opss</strong>',
                   type: 'error',
                   html:
                     'No puedes unirte a una partida en curso.',
                   confirmButtonText:
                     '<i class="fa fa-thumbs-up"></i> Ok',
                   confirmButtonAriaLabel: 'Ok'
                 })
              setTimeout(4000,  location.href ="/perfil");
             }
         })
}

function añadir_jugador (userId, username, IDPartida) {

  var imgavatar = "http://i66.tinypic.com/10ctdhh.jpg";
  genero = eliminarEspacios(genero);
  console.log(genero);
  if (genero=="Mujer"){
    imgavatar = "http://i64.tinypic.com/xftfds.jpg";
  }

  const comp = db.collection("usuarios").add({
    id_usuario: userId,
    username: username,
    estado: "vivo",
    id_partida : IDPartida,
    rol: null,
    rol_visible: "Aldeano",
    votos:null,
    avatar: imgavatar
  });
  if(comp){
    console.log("Añadido");
    tablero();
  }
  else{
    console.log("Error al añadir");
  }
}

function eliminarEspacios(palabra){
  return palabra.replace(/ /g, "");
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
          trHTML += '<td id="TDvillager" onclick="votar(this)" value="'+doc.data().id_usuario+'" ><img class="avatar" src="'+ doc.data().avatar +'" alt="Avatar">'
              + '<div class="username"><b>' + doc.data().username + '</b> </div>'
              + '<div id="ContadorVotos"  style="color:red; font-weight:bold; margin-left:50px" >Votos: <span id="'+eliminarEspacios(doc.data().id_usuario)+'" >0 </span> </div>'
              + '<div class="rol">' + doc.data().rol_visible+ '</div>'+ '</td>';

          if (cont==4){
              trHTML += '<tr>'
              cont=0;
          }


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

  socket.on('messages', function(data) {
    render(data);

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

    if (message.text!="" && estado!="Noche" && Muerte==false){

    socket.emit('new-message', message);
    }
    return false;
  }

   //chat NOCHE

  socket.on('messagesN', function(data) {
    renderN(data);

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
    //solo si es lobo
    if (messageN.text!="" && rol=="Lobo" && estado=="Noche"){

    socket.emit('new-messageN', messageN);
    }
    return false;
  }

// carga el div de la accion que tiene su personaje
function cargar_accion(){
  if (rol=="Cura")
  var accion = '<img src="/img/cura.png" alt="Cura">'
  if (rol=="Psicopata")
  var accion = '<img src="/img/psicopata.png" alt="Cura"  >'
  if (rol=="Pistolero")
  var accion = '<img src="/img/pistolero.png" alt="Cura"  >'
  if (rol=="Vidente")
  var accion = '<img src="/img/vidente.png" alt="Cura"  >'
  if (rol=="Hechicero")
  var accion = '<img src="/img/hechicero.png" alt="Cura"  >'
  if (rol=="Guardaespaldas")
  var accion = '<img src="/img/guardaespaldas.png" alt="Cura"  >'
  if (rol=="Doctor")
  var accion = '<img src="/img/doctor.png" alt="Cura"  >'

  $('#accion').html(accion);
}
function accion(){
  accion=true;
}
function accion_rol () {
    var rolvisto=""
  //accion vidente
  if (rol=="Vidente" && accionVidente==true){
    db.collection("usuarios").where("id_usuario","==",UsuarioVotado)
         .get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {               
                rolvisto = doc.data().rol;
            });
          });
        
        console.log(rolvisto);
        accionVidente=false;
  }
  if(rol=="Pistolero"){
    socket.emit("Balas", userId, UsuarioVotado);
  }

}
