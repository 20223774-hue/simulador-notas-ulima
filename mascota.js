let mascota = document.getElementById("mascota");
let x = 0;
let direccion = 1;

setInterval(() => {
  x += 2 * direccion;
  mascota.style.left = x + "px";

  if (x > window.innerWidth - 50) {
    direccion = -1;
    mascota.style.transform = "scaleX(-1)";
  }

  if (x < 0) {
    direccion = 1;
    mascota.style.transform = "scaleX(1)";
  }
}, 30);

