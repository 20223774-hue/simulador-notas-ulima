(function(){
  // No tocar funciones existentes. Todo encapsulado aquí.
  try {
    // Si el usuario ya apagó la mascota, no inicializar.
    if (localStorage.getItem('mascota-off') === '1') return;

    const masc = document.getElementById('mascota');
    const burbuja = document.getElementById('burbuja');
    if (!masc || !burbuja) return;

    // Estado interno
    let x = parseFloat(localStorage.getItem('mascota-x')) || 20; // px
    let bottom = parseFloat(localStorage.getItem('mascota-bottom')) || 120; // px
    let speed = 0.7 + Math.random() * 0.8; // px per frame unit
    let dir = 1; // 1 derecha, -1 izquierda
    let sleeping = false;
    let docked = false; // si está "subido" a un botón
    let idleTimeout = null;
    const SLEEP_AFTER_MS = 8000; // 8 segundos
    const SAVE_EVERY_MS = 2000;
    let lastSave = Date.now();
    let lastMouseMove = Date.now();

    // Mensajes
    const msgs = [
      "¡Hola!",
      "¿Listo para simular?",
      "¡Buena suerte!",
      "No olvides guardar",
      "Casi listo...",
      "¡Ánimo!",
      "Zzz..."
    ];

    // Inicializar posición y estilos (solo lectura sobre capas existentes)
    function applyPos(){
      masc.style.left = Math.max(6, Math.min(window.innerWidth - 46, x)) + "px";
      masc.style.bottom = bottom + "px";
    }
    applyPos();

    // Guardar posición en localStorage periódicamente
    function savePos(){
      localStorage.setItem('mascota-x', Math.round(x));
      localStorage.setItem('mascota-bottom', Math.round(bottom));
    }

    // Animación de andar
    function step(){
      if (!sleeping && !docked){
        x += dir * speed * (1 + Math.random() * 0.2) * 1.2;
        // bordes
        if (x < 6) { x = 6; dir = 1; }
        if (x > window.innerWidth - 46) { x = window.innerWidth - 46; dir = -1; }
        applyPos();
      }
      // Guardar periódicamente
      if (Date.now() - lastSave > SAVE_EVERY_MS){
        savePos();
        lastSave = Date.now();
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // Mostrar burbuja con texto por un tiempo corto
    let bubbleTimer = null;
    function showBubble(text, ttl=1400){
      if (!text) return;
      burbuja.textContent = text;
      burbuja.classList.add('show');
      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        burbuja.classList.remove('show');
        bubbleTimer = null;
      }, ttl);
    }

    // Dormir/despertar
    function goSleep(){
      sleeping = true;
      masc.classList.add('dormido');
      showBubble("Zzz...", 3000);
    }
    function wakeUp(){
      if (sleeping){
        sleeping = false;
        masc.classList.remove('dormido');
        showBubble("¡Hola!", 1200);
      }
    }
    function resetIdleTimer(){
      lastMouseMove = Date.now();
      if (idleTimeout) { clearTimeout(idleTimeout); idleTimeout = null; }
      idleTimeout = setTimeout(() => {
        // Si no hubo movimiento, dormir
        goSleep();
      }, SLEEP_AFTER_MS);
    }
    // iniciar contador
    resetIdleTimer();

    // React to global mouse movements (no pointer-events on mascot, so this doesn't block UI)
    window.addEventListener('mousemove', (ev) => {
      resetIdleTimer();
      // waking up on any move
      wakeUp();
      // show bubble when near mascot
      const mascRect = masc.getBoundingClientRect();
      const centerX = mascRect.left + mascRect.width/2;
      const centerY = mascRect.top + mascRect.height/2;
      const dx = ev.clientX - centerX;
      const dy = ev.clientY - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 90){
        // show a short message
        showBubble(msgs[Math.floor(Math.random()* (msgs.length-1))], 900);
      }
    }, { passive:true });

    // Listeners sobre botones: al pasar por un botón, la mascota se "sube" visualmente y se posiciona sobre él
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
    const onEnter = (btn) => {
      return function(){
        try {
          const r = btn.getBoundingClientRect();
          const targetX = Math.max(6, Math.min(window.innerWidth - 46, r.left + (r.width/2) - 20));
          // "subirse"
          docked = true;
          masc.classList.add('subido');
          // mover masc above the button smoothly
          // compute bottom so it looks "on top" of button: distance from bottom of viewport
          const computedBottom = Math.max(56, window.innerHeight - r.top + 8);
          // apply movement
          masc.style.transition = "left 300ms ease, bottom 260ms ease, transform 180ms ease";
          x = targetX;
          bottom = computedBottom;
          applyPos();
          // mensaje
          showBubble("¡Me subo!", 1000);
        } catch(e){ /* safe */ }
      };
    };
    const onLeave = (btn) => {
      return function(){
        // volver a caminar después de pequeño delay
        masc.classList.remove('subido');
        masc.style.transition = "left 400ms ease, bottom 260ms ease, transform 180ms ease";
        // restablecer bottom al valor guardado (120 default)
        bottom = parseFloat(localStorage.getItem('mascota-bottom')) || 120;
        docked = false;
        showBubble("Bajando...", 900);
      };
    };

    buttons.forEach(b => {
      // add listeners, but do not modify button behavior
      b.addEventListener('mouseenter', onEnter(b), { passive:true });
      b.addEventListener('mouseleave', onLeave(b), { passive:true });
      // also when button gets focus via keyboard, we "subimos" (accessibility)
      b.addEventListener('focus', onEnter(b), { passive:true });
      b.addEventListener('blur', onLeave(b), { passive:true });
    });

    // Si el usuario hace click sobre un botón, la mascota hace un pequeño salto de alegría (visual)
    buttons.forEach(b => {
      b.addEventListener('click', function(){
        // breve efecto visual
        masc.style.transition = "transform 140ms ease";
        masc.style.transform = "translateY(-10px)";
        setTimeout(() => {
          masc.style.transform = "";
        }, 160);
        // reset idle timer (actividad)
        resetIdleTimer();
      }, { passive:true });
    });

    // Guardar al salir de la página
    window.addEventListener('beforeunload', savePos, { passive:true });
    // Guardar también periódicamente
    setInterval(savePos, SAVE_EVERY_MS);

    // Exponer función para apagar la mascota desde consola o UI
    window.apagarMascota = function(){
      localStorage.setItem('mascota-off','1');
      try {
        masc.remove();
      } catch(e){}
    };
    // función para encender si estaba apagada (manual)
    window.encenderMascota = function(){
      localStorage.removeItem('mascota-off');
      location.reload();
    };

    // Inicializar guardado inmediato
    savePos();

    // Reiniciar posición si se redimensiona (ajustar límites)
    window.addEventListener('resize', function(){
      x = Math.max(6, Math.min(window.innerWidth - 46, x));
      applyPos();
    }, { passive:true });

    // Opcional: técnica para "acariciar" la mascota con click (sin bloquear)
    // detectamos clicks cerca de la mascota y mostramos mensaje amable
    window.addEventListener('click', function(ev){
      const mascRect = masc.getBoundingClientRect();
      const centerX = mascRect.left + mascRect.width/2;
      const centerY = mascRect.top + mascRect.height/2;
      const dx = ev.clientX - centerX;
      const dy = ev.clientY - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 70){
        showBubble("¡Gracias!", 1100);
        resetIdleTimer();
        wakeUp();
      }
    }, { passive:true });

  } catch (err){
    // si algo falla en la inicialización de la mascota, no romper el resto de la app
    console.error("Inicializando mascota: ", err);
  }
})();
