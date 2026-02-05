const APROBACION = 10.5;
const tabla = document.getElementById("tabla");
const canvas = document.getElementById("mathCanvas");
const ctx = canvas.getContext("2d");
const symbols = ["∑","π","√","Δ","∫","∞","+","−","×","÷","=","x","y","z","sin","cos","tan","log","∂","≈","≠","≤","≥","λ","μ","σ","φ","β","θ","∇","1","2","3","4","5","6","7","8","9","0","α","γ","Ω","∴","∵"];
const particles = [];
let maxParticles = 90;
const mouse = { x: -9999, y: -9999, active: false };
const canvasSize = { width: 0, height: 0 };

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  document.querySelectorAll(".btn-theme").forEach((btn) => {
    btn.textContent = (theme === "dark") ? "☀️ Modo claro" : "🌙 Dark mode";
  });
}

function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur==="dark" ? "light" : "dark");
}

(function initTheme(){
  const saved = localStorage.getItem("theme");
  applyTheme(saved || "light");
})();

function resizeCanvas(){
  const ratio = window.devicePixelRatio || 1;
  canvasSize.width = window.innerWidth;
  canvasSize.height = window.innerHeight;
  canvas.width = canvasSize.width * ratio;
  canvas.height = canvasSize.height * ratio;
  canvas.style.width = `${canvasSize.width}px`;
  canvas.style.height = `${canvasSize.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  maxParticles = Math.max(90, Math.round((canvasSize.width * canvasSize.height) / 9000));
}

function createParticle(){
  return {
    x: Math.random() * canvasSize.width,
    y: Math.random() * -canvasSize.height,
    speed: 0.3 + Math.random() * 1.4,
    size: 10 + Math.random() * 14,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    opacity: 0.15 + Math.random() * 0.6
  };
}

function updateParticles(){
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
  ctx.font = "14px system-ui, sans-serif";

  particles.forEach(p => {
    p.y += p.speed;
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if(mouse.active && dist < 120){
      p.x += dx * 0.008;
      p.y += dy * 0.008;
    }
    if(p.y > canvasSize.height + 20){
      p.y = -20;
      p.x = Math.random() * canvasSize.width;
    }

    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.font = `${p.size}px system-ui, sans-serif`;
    ctx.fillStyle = document.documentElement.getAttribute("data-theme") === "dark"
      ? "rgba(148,163,184,0.7)"
      : "rgba(15,23,42,0.5)";
    ctx.fillText(p.symbol, p.x, p.y);
    ctx.restore();
  });

  requestAnimationFrame(updateParticles);
}

function initParticles(){
  particles.length = 0;
  for(let i = 0; i < maxParticles; i++){
    particles.push(createParticle());
  }
}

function setupCanvas(){
  resizeCanvas();
  initParticles();
}

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  mouse.active = true;
});

window.addEventListener("mouseleave", () => {
  mouse.active = false;
});

function agregarFila(nota="", porcentaje=""){
  const tr = document.createElement("tr");
  tr.innerHTML = `
      <td><input type="number" min="1" max="20" step="1" value="${nota}" placeholder="Ej: 14"></td>
      <td><input type="number" min="0" max="100" step="0.01" value="${porcentaje}" placeholder="Ej: 20"></td>
      <td><button onclick="this.closest('tr').remove(); calcular();">✖</button></td>`;
  tabla.appendChild(tr);
}

// filas iniciales
agregarFila(); agregarFila(); agregarFila();

function leer(){
  return [...tabla.querySelectorAll("tr")].map(r=>{
    const i=r.querySelectorAll("input");
    const notaStr = i[0].value.trim();
    const porcStr = i[1].value.trim();
    return {
      nota: notaStr==="" ? null : Number(notaStr),
      p: porcStr==="" ? 0 : Number(porcStr)
    };
  }).filter(x => x.nota !== null || x.p !== 0);
}

function calcular(){
  const it = leer();
  let suma = 0, total = 0, sumaConocidas = 0;

  it.forEach(x=>{
    total += x.p;
    if(x.nota !== null){
      suma += x.nota * x.p / 100;
      sumaConocidas += x.p;
    }
  });

  document.getElementById("resultado").textContent = suma.toFixed(2);
  document.getElementById("estado").innerHTML =
    suma >= APROBACION ? '<span class="ok">APROBADO ✅</span>' : '<span class="bad">NO APROBADO ❌</span>';

  const msg = document.getElementById("mensajeExtra");
  if(total < 100){
    msg.textContent = `Te falta completar ${(100-total).toFixed(2)}% de porcentajes.`;
    msg.className = "small";
  } else if(total > 100.0001){
    msg.textContent = `Ojo: tus porcentajes suman ${total.toFixed(2)}% (debería ser 100%).`;
    msg.className = "small bad";
  } else {
    msg.textContent = "";
    msg.className = "small";
  }
}

function correrSimulacion(){
  const it = leer();
  const total = it.reduce((a,x)=>a+x.p,0);
  if(total > 100.0001){
    alert("Tus porcentajes suman más de 100%. Corrige eso.");
    return;
  }

  const pend = it.filter(x=>x.nota==null && x.p>0);
  if(pend.length===0){
    alert("No hay evaluaciones pendientes (nota vacía con %).");
    return;
  }

  let head = '<tr><th>Obj</th><th>Prom</th><th>Estado</th>';
  pend.forEach(p=> head += `<th><span class="pill">${p.p.toFixed(2)}%</span></th>`);
  head += '</tr>';
  document.getElementById("escHead").innerHTML = head;

  const tbody = document.getElementById("escenarios");
  tbody.innerHTML = "";

  const hasta = Number(document.getElementById("hastaProm").value);
  const paso  = Number(document.getElementById("pasoProm").value);

  const conocidas = it.filter(x=>x.nota!=null);
  const sumaConocidas = conocidas.reduce((a,x)=>a + x.nota * x.p / 100, 0);
  const porcPend = pend.reduce((a,x)=>a + x.p, 0);

  function generarNotas(pendientes, promedioReq){
    const redondearNota = (nota) => Math.min(20, Math.max(1, Math.round(nota)));
    if(pendientes.length === 1){
      return [redondearNota(promedioReq)];
    }

    const totalPeso = pendientes.reduce((a,x)=>a+x.p,0);
    const objetivo = promedioReq * totalPeso;
    const notas = [];
    let suma = 0;
    let pesoRestante = totalPeso;

    for(let i = 0; i < pendientes.length; i++){
      const p = pendientes[i].p;
      pesoRestante -= p;
      const minRem = 1 * pesoRestante;
      const maxRem = 20 * pesoRestante;
      const minNota = Math.max(1, (objetivo - suma - maxRem) / p);
      const maxNota = Math.min(20, (objetivo - suma - minRem) / p);
      if(minNota > maxNota || Number.isNaN(minNota) || Number.isNaN(maxNota)){
        return pendientes.map(()=> promedioReq);
      }

      const nota = i === pendientes.length - 1
        ? (objetivo - suma) / p
        : (Math.random() * (maxNota - minNota)) + minNota;
      const notaFinal = redondearNota(nota);
      notas.push(notaFinal);
      suma += notaFinal * p;
    }

    return notas;
  }

  for(let target = APROBACION; target <= hasta + 1e-9; target += paso){
    const requerido = (target - sumaConocidas) / (porcPend / 100);
    const esPosible = Number.isFinite(requerido) && requerido >= 1 && requerido <= 20;
    const notas = esPosible ? generarNotas(pend, requerido) : [];
    const sumaPend = esPosible
      ? notas.reduce((acc, n, idx)=> acc + (n * pend[idx].p / 100), 0)
      : 0;
    const promFinal = esPosible ? (sumaConocidas + sumaPend) : null;

    tbody.innerHTML += `
        <tr>
          <td>${target.toFixed(1)}</td>
          <td>${esPosible ? promFinal.toFixed(2) : '—'}</td>
          <td>${esPosible ? (promFinal>=APROBACION ? '✅' : '❌') : '❌'}</td>
          ${pend.map((_, idx)=>`<td>${esPosible ? notas[idx].toFixed(0) : '—'}</td>`).join("")}
        </tr>`;
  }

  calcular();
  renderMiniatura(it, total);
  mostrarVista("simulacion");
}

function renderMiniatura(items, total){
  const tbody = document.getElementById("miniaturaDatos");
  tbody.innerHTML = "";

  items.forEach((item, idx) => {
    const notaTexto = item.nota === null ? "—" : item.nota.toFixed(0);
    const porcTexto = item.p ? `${item.p.toFixed(2)}%` : "—";
    tbody.innerHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td>${notaTexto}</td>
          <td>${porcTexto}</td>
        </tr>`;
  });

  const msg = document.getElementById("miniaturaMensaje");
  if(total < 100){
    msg.textContent = `Te falta completar ${(100-total).toFixed(2)}% de porcentajes.`;
    msg.className = "small";
  } else if(total > 100.0001){
    msg.textContent = `Ojo: tus porcentajes suman ${total.toFixed(2)}% (debería ser 100%).`;
    msg.className = "small bad";
  } else {
    msg.textContent = "Porcentajes completos (100%).";
    msg.className = "small ok";
  }
}

let vistaActual = "inicio";

function mostrarVista(vista){
  const inicio = document.getElementById("vistaInicio");
  const entrada = document.getElementById("vistaEntrada");
  const simulacion = document.getElementById("vistaSimulacion");
  const cursos = document.getElementById("vistaCursos");
  const horario = document.getElementById("vistaHorario");
  if(vista === "simulacion"){
    inicio.style.display = "none";
    entrada.style.display = "none";
    simulacion.style.display = "block";
    cursos.style.display = "none";
    horario.style.display = "none";
  } else if(vista === "entrada"){
    inicio.style.display = "none";
    entrada.style.display = "block";
    simulacion.style.display = "none";
    cursos.style.display = "none";
    horario.style.display = "none";
  } else if(vista === "cursos"){
    inicio.style.display = "none";
    entrada.style.display = "none";
    simulacion.style.display = "none";
    cursos.style.display = "block";
    horario.style.display = "none";
  } else if(vista === "horario"){
    inicio.style.display = "none";
    entrada.style.display = "none";
    simulacion.style.display = "none";
    cursos.style.display = "none";
    horario.style.display = "block";
  } else {
    inicio.style.display = "block";
    entrada.style.display = "none";
    simulacion.style.display = "none";
    cursos.style.display = "none";
    horario.style.display = "none";
  }
  vistaActual = vista;
  document.body.classList.toggle("inicio-activo", vista === "inicio");
}

function volverEdicion(){
  mostrarVista("entrada");
}

function volverInicio(){
  mostrarVista("inicio");
}

function iniciarSimulador(){
  mostrarVista("entrada");
}

function iniciarSimuladorCursos(){
  mostrarVista("cursos");
}

function volverCursos(){
  mostrarVista("cursos");
}

setupCanvas();
updateParticles();
mostrarVista("inicio");
calcular();

const cursos = [
  { id:"lenguaje-1", nombre:"Lenguaje y Comunicación I", nivel:1, tipo:"obligatorio", creditos:4, requisitos:[] },
  { id:"intro-ingenieria", nombre:"Introducción a la Ingeniería", nivel:1, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"desarrollo-personal", nombre:"Desarrollo Personal y Social", nivel:1, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"metodologias-investigacion", nombre:"Metodologías de la Investigación", nivel:1, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"etica-civica", nombre:"Ética Cívica", nivel:1, tipo:"obligatorio", creditos:2, requisitos:[] },
  { id:"matematica-basica", nombre:"Matemática Básica", nivel:1, tipo:"obligatorio", creditos:5, requisitos:[] },

  { id:"lenguaje-2", nombre:"Lenguaje y Comunicación II", nivel:2, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"lenguaje-1" }] },
  { id:"procesos-sociales", nombre:"Procesos Sociales y Políticos", nivel:2, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"algebra-lineal", nombre:"Álgebra Lineal", nivel:2, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"matematica-basica" }] },
  { id:"economia-empresa", nombre:"Economía y Empresa", nivel:2, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"temas-filosofia", nombre:"Temas de Filosofía", nivel:2, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"calculo-1", nombre:"Cálculo I", nivel:2, tipo:"obligatorio", creditos:5, requisitos:[{ tipo:"curso", id:"matematica-basica" }] },

  { id:"sistemas-organizacionales", nombre:"Sistemas Organizacionales", nivel:3, tipo:"obligatorio", creditos:2, requisitos:[{ tipo:"curso", id:"economia-empresa" }] },
  { id:"diseno-cad", nombre:"Diseño Asistido por el Computador", nivel:3, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"algebra-lineal" }] },
  { id:"ia-aplicada", nombre:"Inteligencia Artificial Aplicada", nivel:3, tipo:"obligatorio", creditos:3, requisitos:[] },
  { id:"fisica-1", nombre:"Física I", nivel:3, tipo:"obligatorio", creditos:5, requisitos:[{ tipo:"curso", id:"calculo-1" }] },
  { id:"quimica-general", nombre:"Química General", nivel:3, tipo:"obligatorio", creditos:4, requisitos:[] },
  { id:"calculo-2", nombre:"Cálculo II", nivel:3, tipo:"obligatorio", creditos:5, requisitos:[{ tipo:"curso", id:"calculo-1" }] },

  { id:"costeo-operaciones", nombre:"Costeo de Operaciones", nivel:4, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"sistemas-organizacionales" }] },
  { id:"fundamentos-programacion", nombre:"Fundamentos de Programación", nivel:4, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"ia-aplicada" }] },
  { id:"fisica-2", nombre:"Física II", nivel:4, tipo:"obligatorio", creditos:5, requisitos:[{ tipo:"curso", id:"fisica-1" }] },
  { id:"estadistica-probabilidad", nombre:"Estadística y Probabilidad", nivel:4, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"calculo-1" }] },
  { id:"mecanica", nombre:"Mecánica", nivel:4, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"fisica-1" }, { tipo:"curso", id:"diseno-cad" }] },
  { id:"calculo-3", nombre:"Cálculo III", nivel:4, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"calculo-2" }] },

  { id:"io-1", nombre:"Investigación de Operaciones I", nivel:5, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"fundamentos-programacion" }] },
  { id:"fundamentos-logistica", nombre:"Fundamentos de Operaciones y Logística", nivel:5, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"costeo-operaciones" }] },
  { id:"ingenieria-economica", nombre:"Ingeniería Económica", nivel:5, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"costeo-operaciones" }] },
  { id:"electricidad-electronica", nombre:"Electricidad y Electrónica", nivel:5, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"fisica-2" }] },
  { id:"ecuaciones-diferenciales", nombre:"Ecuaciones Diferenciales", nivel:5, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"calculo-3" }] },
  { id:"diseno-experimentos", nombre:"Diseño de Experimentos", nivel:5, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"estadistica-probabilidad" }] },

  { id:"io-2", nombre:"Investigación de Operaciones II", nivel:6, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"io-1" }] },
  { id:"ergonomia", nombre:"Ergonomía y Diseño del Trabajo", nivel:6, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"estadistica-probabilidad" }] },
  { id:"innovacion-ingenieria", nombre:"Innovación en Ingeniería", nivel:6, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"electricidad-electronica" }, { tipo:"curso", id:"mecanica" }] },
  { id:"planeamiento-control", nombre:"Planeamiento y Control de Operaciones", nivel:6, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"fundamentos-logistica" }] },
  { id:"procesos-industriales", nombre:"Procesos Industriales", nivel:6, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"quimica-general" }, { tipo:"curso", id:"fisica-2" }] },

  { id:"ingenieria-financiera", nombre:"Ingeniería Financiera", nivel:7, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"ingenieria-economica" }] },
  { id:"diseno-instalaciones", nombre:"Diseño de Instalaciones", nivel:7, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"ergonomia" }] },
  { id:"inteligencia-negocios", nombre:"Inteligencia de Negocios", nivel:7, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"nivel", valor:5 }] },
  { id:"modelos-logisticos", nombre:"Modelos de Sistemas Logísticos", nivel:7, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"fundamentos-logistica" }] },
  { id:"calidad", nombre:"Calidad", nivel:7, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"diseno-experimentos" }] },
  { id:"procesos-manufactura", nombre:"Procesos de Manufactura", nivel:7, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"innovacion-ingenieria" }] },

  { id:"simulacion-procesos", nombre:"Simulación de Procesos", nivel:8, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"io-2" }] },
  { id:"modelamiento-predictivo", nombre:"Modelamiento Predictivo de Datos", nivel:8, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"inteligencia-negocios" }] },
  { id:"sistemas-gestion", nombre:"Sistemas Integrados de Gestión", nivel:8, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"calidad" }] },
  { id:"gestion-proyectos", nombre:"Gestión de Proyectos", nivel:8, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"nivel", valor:6 }] },
  { id:"analisis-problemas", nombre:"Análisis de Problemas de Ingeniería", nivel:8, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"modelos-logisticos" }, { tipo:"curso", id:"calidad" }] },
  { id:"automatizacion-industrial", nombre:"Automatización Industrial", nivel:8, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"procesos-manufactura" }] },

  { id:"etica-gestion", nombre:"Ética y Gestión Humana", nivel:9, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"proyecto-aplicada-1", nombre:"Proyecto de Ingeniería Aplicada I", nivel:9, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"analisis-problemas" }] },
  { id:"ingenieria-comercial", nombre:"Ingeniería Comercial", nivel:9, tipo:"obligatorio", creditos:3, requisitos:[{ tipo:"curso", id:"modelos-logisticos" }] },

  { id:"proyecto-aplicada-2", nombre:"Proyecto de Ingeniería Aplicada II", nivel:10, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"proyecto-aplicada-1" }, { tipo:"curso", id:"simulacion-procesos" }] },
  { id:"gerencia-estrategica", nombre:"Gerencia Estratégica", nivel:10, tipo:"obligatorio", creditos:4, requisitos:[{ tipo:"curso", id:"ingenieria-financiera" }, { tipo:"curso", id:"ingenieria-comercial" }] },

  { id:"globalizacion", nombre:"Globalización, Capitalismo y Ciencia en el Mundo Contemporáneo", nivel:6, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:80 }] },
  { id:"taller-liderazgo", nombre:"Taller de Liderazgo", nivel:6, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:80 }] },
  { id:"programacion-ingenieria", nombre:"Programación para Ingeniería", nivel:6, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:80 }] },

  { id:"sistemas-info", nombre:"Sistemas de Información Gerencial", nivel:7, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:100 }] },
  { id:"taller-habilidades", nombre:"Taller de Habilidades Gerenciales", nivel:7, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:100 }] },

  { id:"tecnologia-industrial", nombre:"Tecnología Industrial", nivel:8, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"intro-bd", nombre:"Introducción a Sistemas de Gestión de Bases de Datos", nivel:8, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"creatividad", nombre:"Creatividad, Innovación y Emprendimiento", nivel:8, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"lean-six-sigma", nombre:"Lean Six Sigma", nivel:8, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"gestion-servicios", nombre:"Gestión de Operaciones de Servicios", nivel:8, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },

  { id:"gestion-proyectos-diseno", nombre:"Gestión de Proyectos de Diseño", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"supply-chain", nombre:"Supply Chain Management", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"compras-abastecimiento", nombre:"Compras y Gestión del Abastecimiento", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"formulacion-proyectos", nombre:"Formulación y Evaluación de Proyectos", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"metodologias-agiles", nombre:"Metodologías Ágiles", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"comercio-internacional", nombre:"Gestión del Comercio Internacional", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"diseno-prototipado", nombre:"Diseño y Prototipado", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"machine-learning", nombre:"Machine Learning", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"herramientas-informaticas", nombre:"Herramientas Informáticas", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"sostenibilidad-industrial", nombre:"Sostenibilidad Industrial", nivel:9, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },

  { id:"transformacion-digital", nombre:"Transformación Digital", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"estrategia-inteligencia", nombre:"Estrategia de Inteligencia Empresarial", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"juego-negocios", nombre:"Juego de Negocios", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"direccion-proyectos", nombre:"Dirección en Implementación de Proyectos", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"diseno-proyectos", nombre:"Diseño de Proyectos Sostenibles", nivel:10, tipo:"electivo", creditos:4, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"tecnologias-programacion", nombre:"Tecnologías de Programación", nivel:10, tipo:"electivo", creditos:4, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"rpa", nombre:"Robotic Process Automation", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"nivel", valor:7 }] },
  { id:"procesos-logisticos-erp", nombre:"Procesos Logísticos ERP", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"ingenieria-transporte", nombre:"Ingeniería del Transporte y Distribución", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"gestion-recursos", nombre:"Gestión de Recursos", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"gestion-riesgos", nombre:"Gestión de Riesgos y Portafolios", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"gerencia-b2b", nombre:"Gerencia B2B", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] },
  { id:"marketing-digital", nombre:"Herramientas de Marketing Digital", nivel:10, tipo:"electivo", creditos:3, requisitos:[{ tipo:"creditos", valor:120 }] }
];

const cursosPorId = cursos.reduce((acc, curso) => {
  acc[curso.id] = curso;
  return acc;
}, {});

function renderChecklist(){
  const contenedor = document.getElementById("courseChecklist");
  const tipos = [
    { key:"obligatorio", label:"📘 Cursos obligatorios" },
    { key:"electivo", label:"🎓 Cursos electivos" }
  ];

  contenedor.innerHTML = tipos.map((tipo) => {
    const cursosTipo = cursos.filter(curso => curso.tipo === tipo.key);
    const niveles = [...new Set(cursosTipo.map(curso => curso.nivel))].sort((a,b) => a - b);

    const cards = niveles.map(nivel => {
      const cursosNivel = cursosTipo.filter(curso => curso.nivel === nivel);
      const items = cursosNivel.map(curso => `
          <label class="course-item">
            <input type="checkbox" data-curso-id="${curso.id}" data-nivel="${nivel}" data-tipo="${tipo.key}">
            <div class="course-meta">
              <span>${curso.nombre}</span>
              <small>${curso.creditos} créditos · ${formatearRequisitos(curso)}</small>
            </div>
          </label>
        `).join("");

      return `
          <div class="course-card">
            <h4 class="course-level-header">
              <span>Nivel ${nivel}</span>
              <label class="level-toggle">
                <input type="checkbox" data-nivel="${nivel}" data-tipo="${tipo.key}" class="level-toggle-input">
                Marcar todo
              </label>
            </h4>
            <div class="checkbox-grid">
              ${items}
            </div>
          </div>
        `;
    }).join("");

    return `
        <div class="course-card">
          <h3>${tipo.label}</h3>
          ${cards}
        </div>
      `;
  }).join("");
}

function formatearRequisitos(curso){
  if(!curso.requisitos.length){
    return "Sin requisitos";
  }
  const partes = curso.requisitos.map(req => {
    if(req.tipo === "curso"){
      return cursosPorId[req.id]?.nombre || "Curso previo";
    }
    if(req.tipo === "creditos"){
      return `Créditos aprobados: ${req.valor}`;
    }
    if(req.tipo === "nivel"){
      return `Culminar nivel ${req.valor}`;
    }
    return "Requisito";
  });
  const lista = partes.map(parte => `<li>${parte}</li>`).join("");
  return `Requisitos:<ul class="req-list">${lista}</ul>`;
}

function obtenerCursosAprobados(){
  const checks = document.querySelectorAll("#courseChecklist input[type='checkbox']");
  return new Set([...checks].filter(check => check.checked && check.dataset.cursoId).map(check => check.dataset.cursoId));
}

function actualizarTogglesNivel(){
  const toggles = document.querySelectorAll(".level-toggle-input");
  toggles.forEach(toggle => {
    const nivel = toggle.dataset.nivel;
    const tipo = toggle.dataset.tipo;
    const cursosNivel = document.querySelectorAll(`#courseChecklist input[type='checkbox'][data-curso-id][data-nivel='${nivel}'][data-tipo='${tipo}']`);
    const todosMarcados = [...cursosNivel].length > 0 && [...cursosNivel].every(check => check.checked);
    toggle.checked = todosMarcados;
  });
}

function calcularNivelCicloDesde(aprobados, actualizarInput = true){
  const obligatorios = cursos.filter(curso => curso.tipo === "obligatorio");
  const niveles = [...new Set(obligatorios.map(curso => curso.nivel))].sort((a, b) => a - b);
  let nivelCompletado = 0;
  niveles.forEach(nivel => {
    const cursosNivel = obligatorios.filter(curso => curso.nivel === nivel);
    const completado = cursosNivel.every(curso => aprobados.has(curso.id));
    if(completado){
      nivelCompletado = nivel;
    }
  });
  const maxNivel = niveles[niveles.length - 1] || 0;
  const nivelCiclo = nivelCompletado >= maxNivel ? maxNivel : Math.max(1, nivelCompletado + 1);
  if(actualizarInput){
    const inputNivel = document.getElementById("nivelCulminado");
    inputNivel.value = nivelCiclo;
  }
  return { nivelCiclo, nivelCompletado };
}

function calcularCreditosDesde(aprobados, actualizarInput = true){
  const resumen = [...aprobados].reduce((acc, id) => {
    const curso = cursosPorId[id];
    if(!curso){
      return acc;
    }
    if(curso.tipo === "electivo"){
      acc.electivos += curso.creditos || 0;
    } else {
      acc.obligatorios += curso.creditos || 0;
    }
    acc.total += curso.creditos || 0;
    return acc;
  }, { total: 0, obligatorios: 0, electivos: 0 });

  if(actualizarInput){
    const inputCreditos = document.getElementById("creditosAprobados");
    const inputElectivos = document.getElementById("creditosElectivos");
    if(inputCreditos){
      inputCreditos.value = resumen.obligatorios;
    }
    if(inputElectivos){
      inputElectivos.value = resumen.electivos;
    }
  }
  return resumen.total;
}

function calcularNivelCiclo(aprobados){
  return calcularNivelCicloDesde(aprobados, true);
}

function calcularCreditosAprobados(){
  const aprobados = obtenerCursosAprobados();
  return calcularCreditosDesde(aprobados, true);
}

function requisitosCumplidos(curso, aprobados, creditos, nivelCompletado){
  return curso.requisitos.every(req => {
    if(req.tipo === "curso"){
      return aprobados.has(req.id);
    }
    if(req.tipo === "creditos"){
      return creditos >= req.valor;
    }
    if(req.tipo === "nivel"){
      return nivelCompletado >= req.valor;
    }
    return false;
  });
}

function simularCursos(){
  const aprobados = obtenerCursosAprobados();
  const creditos = calcularCreditosAprobados();
  const { nivelCompletado } = calcularNivelCiclo(aprobados);

  const disponibles = cursos.filter(curso => !aprobados.has(curso.id) && requisitosCumplidos(curso, aprobados, creditos, nivelCompletado));
  const obligatorios = disponibles.filter(curso => curso.tipo === "obligatorio");
  const electivos = disponibles.filter(curso => curso.tipo === "electivo");

  renderResultados("resultadoObligatorios", "emptyObligatorios", obligatorios);
  renderResultados("resultadoElectivos", "emptyElectivos", electivos);
}

function renderResultados(listaId, emptyId, cursosDisponibles){
  const lista = document.getElementById(listaId);
  const empty = document.getElementById(emptyId);
  if(!cursosDisponibles.length){
    lista.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  lista.innerHTML = cursosDisponibles.map(curso => `
      <li>
        <strong>${curso.nombre}</strong>
        <div class="course-tags">
          <span>Nivel ${curso.nivel}</span>
          <span>${curso.tipo === "obligatorio" ? "Obligatorio" : "Electivo"}</span>
          <span>${curso.creditos} créditos</span>
        </div>
        <div class="course-reqs">${formatearRequisitos(curso)}</div>
      </li>
    `).join("");
}

function limpiarCursos(){
  document.querySelectorAll("#courseChecklist input[type='checkbox']").forEach(check => {
    check.checked = false;
  });
  document.getElementById("creditosAprobados").value = 0;
  document.getElementById("creditosElectivos").value = 0;
  document.getElementById("nivelCulminado").value = 1;
  renderResultados("resultadoObligatorios", "emptyObligatorios", []);
  renderResultados("resultadoElectivos", "emptyElectivos", []);
  renderSchedule();
}

const horarioState = {
  badges: [],
  counter: 1
};

function obtenerCursosPlaneados(){
  return new Set(horarioState.badges.flatMap(badge => badge.cursos));
}

function agregarGafete(){
  const id = `badge-${Date.now()}-${horarioState.counter}`;
  horarioState.badges.push({
    id,
    titulo: `Ciclo ${horarioState.counter}`,
    cursos: []
  });
  horarioState.counter += 1;
  renderSchedule();
}

function eliminarGafete(id){
  horarioState.badges = horarioState.badges.filter(badge => badge.id !== id);
  renderSchedule();
}

function abrirHorario(){
  if(horarioState.badges.length === 0){
    agregarGafete();
  } else {
    renderSchedule();
  }
  mostrarVista("horario");
}

function renderSchedule(){
  renderScheduleList();
  renderScheduleBadges();
}

function renderScheduleList(){
  const lista = document.getElementById("scheduleCourseList");
  const empty = document.getElementById("scheduleEmpty");
  if(!lista || !empty){
    return;
  }
  const aprobadosBase = obtenerCursosAprobados();
  const planeados = obtenerCursosPlaneados();
  const aprobados = new Set([...aprobadosBase, ...planeados]);
  const creditos = calcularCreditosDesde(aprobados, false);
  const { nivelCompletado } = calcularNivelCicloDesde(aprobados, false);
  const disponibles = cursos.filter(curso => !aprobados.has(curso.id) && requisitosCumplidos(curso, aprobados, creditos, nivelCompletado));

  if(!disponibles.length){
    lista.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  lista.innerHTML = disponibles.map(curso => `
      <div class="schedule-item" draggable="true" data-curso-id="${curso.id}">
        <strong>${curso.nombre}</strong>
        <div class="course-tags">
          <span>Nivel ${curso.nivel}</span>
          <span>${curso.tipo === "obligatorio" ? "Obligatorio" : "Electivo"}</span>
          <span>${curso.creditos} créditos</span>
        </div>
      </div>
    `).join("");

  lista.querySelectorAll(".schedule-item").forEach(item => {
    item.addEventListener("dragstart", handleCourseDragStart);
  });
}

function renderScheduleBadges(){
  const contenedor = document.getElementById("scheduleBadges");
  if(!contenedor){
    return;
  }
  contenedor.innerHTML = horarioState.badges.map(badge => {
    const cursosBadge = badge.cursos.map(cursoId => {
      const curso = cursosPorId[cursoId];
      if(!curso){
        return "";
      }
      return `
          <div class="badge-course" draggable="true" data-curso-id="${cursoId}" data-badge-id="${badge.id}">
            <span>${curso.nombre}</span>
            <button type="button" data-curso-id="${cursoId}" data-badge-id="${badge.id}">✕</button>
          </div>
        `;
    }).join("");

    const empty = badge.cursos.length === 0 ? `<div class="badge-empty">Arrastra cursos aquí</div>` : "";

    return `
        <div class="badge-card" data-badge-id="${badge.id}">
          <div class="badge-header">
            <input class="badge-title" type="text" value="${badge.titulo}" data-badge-id="${badge.id}">
            <button class="btn-ghost badge-remove" type="button" data-badge-id="${badge.id}">Eliminar</button>
          </div>
          <div class="badge-dropzone" data-badge-id="${badge.id}">
            ${empty}
            ${cursosBadge}
          </div>
        </div>
      `;
  }).join("");

  contenedor.querySelectorAll(".badge-title").forEach(input => {
    input.addEventListener("input", event => {
      const badge = horarioState.badges.find(item => item.id === event.target.dataset.badgeId);
      if(badge){
        badge.titulo = event.target.value.trim() || "Ciclo";
      }
    });
  });

  contenedor.querySelectorAll(".badge-remove").forEach(button => {
    button.addEventListener("click", event => {
      eliminarGafete(event.currentTarget.dataset.badgeId);
    });
  });

  contenedor.querySelectorAll(".badge-dropzone").forEach(zone => {
    zone.addEventListener("dragover", event => {
      event.preventDefault();
    });
    zone.addEventListener("dragenter", event => {
      event.preventDefault();
      event.currentTarget.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", event => {
      event.currentTarget.classList.remove("drag-over");
    });
    zone.addEventListener("drop", event => {
      event.preventDefault();
      const cursoId = event.dataTransfer.getData("text/plain");
      event.currentTarget.classList.remove("drag-over");
      asignarCursoAGafete(cursoId, event.currentTarget.dataset.badgeId);
    });
  });

  contenedor.querySelectorAll(".badge-course").forEach(item => {
    item.addEventListener("dragstart", handleCourseDragStart);
  });

  contenedor.querySelectorAll(".badge-course button").forEach(button => {
    button.addEventListener("click", event => {
      const cursoId = event.currentTarget.dataset.cursoId;
      const badgeId = event.currentTarget.dataset.badgeId;
      removerCursoDeGafete(cursoId, badgeId);
    });
  });
}

function handleCourseDragStart(event){
  event.dataTransfer.setData("text/plain", event.currentTarget.dataset.cursoId);
  event.dataTransfer.effectAllowed = "move";
}

function asignarCursoAGafete(cursoId, badgeId){
  if(!cursoId || !badgeId){
    return;
  }
  if(!puedeAsignarCursoAGafete(cursoId, badgeId)){
    alert("No puedes colocar este curso en este ciclo. Sus requisitos, créditos o nivel deben estar completados en ciclos anteriores.");
    return;
  }
  horarioState.badges.forEach(badge => {
    badge.cursos = badge.cursos.filter(id => id !== cursoId);
  });
  const destino = horarioState.badges.find(badge => badge.id === badgeId);
  if(destino && !destino.cursos.includes(cursoId)){
    destino.cursos.push(cursoId);
  }
  renderSchedule();
}

function puedeAsignarCursoAGafete(cursoId, badgeId){
  const curso = cursosPorId[cursoId];
  if(!curso){
    return false;
  }
  const badgeIndex = horarioState.badges.findIndex(badge => badge.id === badgeId);
  if(badgeIndex < 0){
    return false;
  }
  const aprobados = obtenerCursosAprobados();
  const cursosPrevios = horarioState.badges
    .slice(0, badgeIndex)
    .flatMap(badge => badge.cursos);
  const base = new Set([...aprobados, ...cursosPrevios]);
  const creditos = calcularCreditosDesde(base, false);
  const { nivelCompletado } = calcularNivelCicloDesde(base, false);
  return requisitosCumplidos(curso, base, creditos, nivelCompletado);
}

function removerCursoDeGafete(cursoId, badgeId){
  const badge = horarioState.badges.find(item => item.id === badgeId);
  if(!badge){
    return;
  }
  badge.cursos = badge.cursos.filter(id => id !== cursoId);
  renderSchedule();
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return map[char] || char;
  });
}

function guardarGafetesPdf(){
  if(horarioState.badges.length === 0){
    alert("Agrega al menos un gafete antes de guardar.");
    return;
  }

  const contenidoBadges = horarioState.badges.map((badge, index) => {
    const titulo = escapeHtml(badge.titulo || `Ciclo ${index + 1}`);
    const cursos = badge.cursos
      .map((cursoId) => cursosPorId[cursoId])
      .filter(Boolean)
      .map((curso) => `<li>${escapeHtml(curso.nombre)}</li>`)
      .join("");
    const detalle = cursos || '<li class="badge-empty">Sin cursos asignados</li>';

    return `
        <section class="badge-card">
          <h2>${titulo}</h2>
          <ul>${detalle}</ul>
        </section>
      `;
  }).join("");

  const plantilla = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Gafetes por ciclo</title>
          <style>
            *{ box-sizing:border-box; }
            body{
              font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
              margin:24px;
              color:#0f172a;
              background:white;
            }
            h1{
              margin:0 0 16px;
              font-size:22px;
            }
            .badge-grid{
              display:flex;
              flex-direction:column;
              gap:16px;
            }
            .badge-card{
              border:1px solid #e2e8f0;
              border-radius:14px;
              padding:14px 16px;
            }
            .badge-card h2{
              margin:0 0 10px;
              font-size:18px;
            }
            .badge-card ul{
              margin:0;
              padding-left:18px;
              display:flex;
              flex-direction:column;
              gap:6px;
            }
            .badge-empty{
              color:#64748b;
              font-style:italic;
            }
          </style>
        </head>
        <body>
          <h1>🗂️ Gafetes por ciclo</h1>
          <div class="badge-grid">
            ${contenidoBadges}
          </div>
        </body>
      </html>
    `;

  const ventana = window.open("", "_blank", "width=1024,height=768");
  if(!ventana){
    alert("No se pudo abrir la ventana para guardar el PDF.");
    return;
  }
  ventana.document.write(plantilla);
  ventana.document.close();
  ventana.focus();
  ventana.onload = () => {
    ventana.print();
    ventana.close();
  };
}

renderChecklist();
document.getElementById("courseChecklist").addEventListener("change", (event) => {
  const target = event.target;
  if(target && target.classList.contains("level-toggle-input")){
    const nivel = target.dataset.nivel;
    const tipo = target.dataset.tipo;
    const cursosNivel = document.querySelectorAll(`#courseChecklist input[type='checkbox'][data-curso-id][data-nivel='${nivel}'][data-tipo='${tipo}']`);
    cursosNivel.forEach(check => {
      check.checked = target.checked;
    });
  }
  actualizarTogglesNivel();
  simularCursos();
  if(vistaActual === "horario"){
    renderSchedule();
  }
});
simularCursos();
actualizarTogglesNivel();
