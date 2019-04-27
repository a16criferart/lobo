window.onload = function() {
    ciclo();
  };

function ciclo() {
    console.log("La partida se iniciara en 15 segundos");
    setInterval( fase1(), 15000);
}

function fase1() {
    console.log ("FASE 1");
    setTimeout(fase2(), 5000);
}
function fase2() {
    console.log ("FASE 2");
    setTimeout(fase3(), 5000);
}
function fase3() {
    console.log ("FASE 3");
    setTimeout(console.log("CICLO COMPLETADO"), 5000);
}