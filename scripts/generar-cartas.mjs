// Genera las páginas de significado de cada carta (/cartas/<slug>/), el índice,
// sitemap.xml y robots.txt, reutilizando los datos y el dibujo de las cartas de index.html.
// Uso: node scripts/generar-cartas.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SITE = "https://arcana-lectura-tarot.netlify.app";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// --- Cargar DECK, SUITS, cardSVG… desde index.html -------------------------
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf("/* =========================================================\n   DATOS: 78 cartas");
const end = script.indexOf("/* =========================================================\n   ESTADO Y UTILIDADES");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script.slice(start, end) + "\nthis.out={DECK,SUITS,RANKS,cardSVG};", ctx);
const { DECK, SUITS, cardSVG } = ctx.out;

// --- Textos extra: [amor, trabajo y dinero, consejo, sí o no] ---------------
const EXTRA = {
  M0:["Un amor nuevo, espontáneo y sin etiquetas. En pareja pide aire fresco y aventuras compartidas.","Empezar algo distinto: un cambio de rumbo, un proyecto propio o un salto profesional sin red.","Atrévete a empezar aunque no lo tengas todo claro.","Sí"],
  M1:["Seducción e iniciativa: tienes lo necesario para conquistar o reactivar la relación.","Momento de demostrar tu talento. Ideal para emprender, negociar o presentar ideas.","Usa lo que ya tienes: tus recursos bastan para empezar.","Sí"],
  M2:["Sentimientos guardados, un amor discreto o algo que todavía no se dice.","Falta información; observa antes de mover ficha y confía en tu criterio.","Escucha tu intuición y guarda silencio un poco más.","Quizá"],
  M3:["Amor cariñoso y fértil: una relación que crece con deseo y cuidado mutuo.","Creatividad y abundancia: proyectos que florecen y frutos del esfuerzo.","Cuida lo que quieres que crezca, empezando por ti.","Sí"],
  M4:["Compromiso, estabilidad y protección; cuidado con querer controlar al otro.","Orden, liderazgo y estructura. Buen momento para asumir responsabilidades.","Pon límites claros y organiza tu plan.","Sí"],
  M5:["Relación formal, compromiso o boda; valores compartidos.","Aprender de alguien con experiencia, formarte o trabajar en una institución.","Busca consejo en quien ya ha recorrido el camino.","Sí"],
  M6:["Amor verdadero y atracción profunda, o una elección sentimental importante.","Toca elegir entre dos caminos: quédate con el que encaje con tus valores.","Elige con el corazón, pero sin traicionarte.","Sí"],
  M7:["La relación avanza; también habla de conquistar a alguien con decisión.","Éxito por mérito propio, ascensos, viajes de trabajo y objetivos cumplidos.","Toma las riendas y avanza sin mirar atrás.","Sí"],
  M8:["Paciencia y ternura para superar una etapa difícil en pareja.","Superas los retos con calma; tu constancia convence más que la presión.","Sé firme sin endurecerte.","Sí"],
  M9:["Tiempo a solas para saber qué quieres; un amor que madura despacio.","Estudio, especialización o un trabajo que pide concentración.","Retírate un momento y escucha lo que ya sabes por dentro.","Quizá"],
  M10:["Un giro inesperado: alguien que llega o una relación que cambia de etapa.","Oportunidades que aparecen de repente; aprovecha la buena racha.","Súbete al cambio en lugar de resistirte.","Sí"],
  M11:["Equilibrio y honestidad: la relación recoge lo que se ha sembrado.","Contratos, papeles y decisiones justas; actúa con transparencia.","Actúa con honestidad contigo y con los demás.","Quizá"],
  M12:["Relación en pausa o una espera que pide paciencia.","Proyectos detenidos; aprovecha para ver la situación desde otro ángulo.","No fuerces: cambia de perspectiva.","No"],
  M13:["Fin de una etapa sentimental que deja paso a algo más auténtico.","Cierre de un ciclo laboral: una transformación necesaria.","Suelta lo que ya terminó.","No"],
  M14:["Reconciliación, armonía y un amor tranquilo que se cuida.","Avance lento pero seguro y buena colaboración.","Ve paso a paso y busca el término medio.","Sí"],
  M15:["Pasión intensa, celos o una relación de dependencia.","Atadura a un trabajo por dinero o miedo; cuidado con los atajos.","Reconoce qué te ata y decide si quieres seguir así.","No"],
  M16:["Una crisis o revelación sacude la relación: lo falso cae.","Cambios bruscos; lo que no era sólido se viene abajo para empezar mejor.","Deja caer lo que no se sostiene.","No"],
  M17:["Esperanza, sanación y un amor sincero en el horizonte.","Inspiración y proyectos con futuro; tu talento se ve.","Confía en que lo mejor está por llegar.","Sí"],
  M18:["Dudas, ilusiones o algo que no se ve claro en la relación.","Confusión o información incompleta; no firmes nada sin leerlo bien.","No decidas desde el miedo: espera a ver con claridad.","No"],
  M19:["Felicidad compartida, amor correspondido y alegría.","Éxito, reconocimiento y energía para todo.","Muéstrate tal como eres y disfruta.","Sí"],
  M20:["Segundas oportunidades, reencuentros o un renacer en pareja.","Una llamada vocacional o una oportunidad que vuelve.","Responde a esa voz interior que te llama.","Sí"],
  M21:["Relación plena y madura; un ciclo sentimental que se completa.","Metas cumplidas, éxito fuera o el cierre brillante de un proyecto.","Celebra lo logrado y prepárate para el siguiente ciclo.","Sí"],
  copas0:["El inicio de un amor o una renovación emocional profunda.","Un proyecto que te ilusiona; trabajo con sentido.","Abre el corazón.","Sí"],
  copas1:["Unión, flechazo o reconciliación.","Una asociación o colaboración que funciona.","Busca el encuentro y el acuerdo.","Sí"],
  copas2:["Diversión, amistades y quizá un romance en una celebración.","Buen ambiente de equipo y logros que celebrar.","Rodéate de quien te suma.","Sí"],
  copas3:["Desgana o rutina; quizá no ves a quien te ofrece cariño.","Aburrimiento laboral; hay oportunidades que estás pasando por alto.","Mira lo que se te ofrece.","No"],
  copas4:["Tristeza por una pérdida o una decepción amorosa.","Un revés que duele, aunque aún hay cosas que salvar.","Llora lo que haga falta y mira lo que sigue en pie.","No"],
  copas5:["Un amor del pasado o una relación tierna y sencilla.","Volver a algo conocido o un trabajo ligado a la infancia y los recuerdos.","Recupera la ilusión sencilla.","Sí"],
  copas6:["Fantasías o varias opciones a la vez; cuidado con idealizar.","Muchas ideas y poca concreción.","Elige una cosa y bájala a tierra.","Quizá"],
  copas7:["Alejarse de una relación que ya no llena.","Dejar un trabajo en busca de algo con más sentido.","Ten el valor de irte si ya no te llena.","No"],
  copas8:["El deseo se cumple: satisfacción en el amor.","Logros y bienestar material.","Pide lo que deseas: puede llegar.","Sí"],
  copas9:["Familia, hogar feliz y amor duradero.","Estabilidad y equilibrio entre la vida y el trabajo.","Valora la armonía que has construido.","Sí"],
  copas10:["Un mensaje romántico, una cita o alguien tierno que se acerca.","Ideas creativas y propuestas en el terreno artístico.","Deja que tu sensibilidad se exprese.","Sí"],
  copas11:["Una declaración o propuesta romántica.","Una oferta atractiva; comprueba que sea real.","Sigue al corazón con los ojos abiertos.","Sí"],
  copas12:["Un amor comprensivo y entregado.","Profesiones de cuidado, arte o ayuda a los demás.","Escucha tu intuición y cuídate también.","Sí"],
  copas13:["Una pareja madura y emocionalmente estable.","Liderazgo empático; buen mediador en conflictos.","Mantén la calma emocional.","Sí"],
  bastos0:["Atracción y pasión que se encienden.","Un proyecto nuevo con mucha energía.","Lánzate con entusiasmo.","Sí"],
  bastos1:["Planes de futuro en pareja o decidir si apostar por alguien.","Planificar el siguiente paso y mirar más allá.","Define a dónde quieres ir.","Quizá"],
  bastos2:["Una relación a distancia o que se abre a nuevos horizontes.","Expansión, negocios fuera y buenas perspectivas.","Piensa en grande.","Sí"],
  bastos3:["Compromiso, irse a vivir juntos o una celebración.","Un logro que celebrar y estabilidad.","Celebra los avances.","Sí"],
  bastos4:["Discusiones o competencia en el amor.","Rivalidad y roces en el trabajo.","Elige bien tus batallas.","No"],
  bastos5:["Éxito en la conquista y orgullo por la relación.","Reconocimiento, ascenso o victoria.","Confía: vas ganando.","Sí"],
  bastos6:["Defender la relación frente a los obstáculos.","Mantener tu puesto o tus ideas ante la presión.","No cedas en lo importante.","Quizá"],
  bastos7:["Noticias rápidas, mensajes o un flechazo.","Avances veloces, viajes o respuestas que por fin llegan.","Muévete rápido: la ocasión es ahora.","Sí"],
  bastos8:["Desconfianza por heridas del pasado.","Cansancio, pero muy cerca de la meta.","Aguanta un poco más, con prudencia.","Quizá"],
  bastos9:["Una relación que pesa o cargar con todo.","Sobrecarga de trabajo.","Reparte el peso.","No"],
  bastos10:["Coqueteo y entusiasmo juvenil.","Ganas de aprender y buenas noticias.","Explora sin miedo.","Sí"],
  bastos11:["Pasión intensa, aunque quizá poco estable.","Acción, viajes y cambios rápidos.","Actúa, pero no quemes etapas.","Sí"],
  bastos12:["Magnetismo y seguridad que atraen.","Liderazgo carismático y emprendedor.","Confía en tu brillo.","Sí"],
  bastos13:["Una pareja apasionada y protectora.","Emprendimiento y visión de negocio.","Lidera con visión y generosidad.","Sí"],
  espadas0:["Verdades que salen a la luz y claridad sobre lo que sientes.","Una idea brillante, una decisión clara o una victoria intelectual.","Di la verdad con claridad.","Sí"],
  espadas1:["Indecisión sentimental o evitar una conversación pendiente.","Bloqueo ante una elección.","Quítate la venda y decide.","Quizá"],
  espadas2:["Desamor, ruptura o celos que duelen.","Una decepción o noticias duras.","Permítete sentir el dolor para poder sanarlo.","No"],
  espadas3:["Una pausa en la relación o necesidad de descanso emocional.","Un descanso o un tiempo para replantearte las cosas.","Descansa antes de decidir.","Quizá"],
  espadas4:["Discusiones en las que nadie gana.","Conflictos con compañeros o competencia desleal.","No ganes a costa de perder.","No"],
  espadas5:["Dejar atrás una relación difícil rumbo a algo más sereno.","Un cambio de trabajo o una mudanza hacia algo mejor.","Avanza hacia aguas tranquilas.","Sí"],
  espadas6:["Secretos o algo que no se dice en la relación.","Estrategia, pero también engaños; protege tus ideas.","Actúa con astucia, sin engañar.","No"],
  espadas7:["Sentirse atrapado en una relación o por los propios miedos.","Bloqueo: crees tener menos opciones de las que tienes.","La salida existe: búscala.","No"],
  espadas8:["Noches en vela por amor, ansiedad o culpa.","Preocupación por el trabajo; los miedos exageran la realidad.","Comparte lo que te angustia.","No"],
  espadas9:["El final definitivo de una relación.","El fin de un trabajo o tocar fondo; desde aquí solo se sube.","Acepta el final y empieza de cero.","No"],
  espadas10:["Curiosidad, mensajes o cotilleos.","Aprender, investigar y estar alerta.","Observa antes de hablar.","Quizá"],
  espadas11:["Alguien directo e impulsivo; conversaciones tensas.","Avanzar rápido con las ideas claras.","Sé directo, pero con tacto.","Quizá"],
  espadas12:["Independencia y un amor con límites claros.","Mente analítica y profesiones de criterio.","Pon límites con claridad.","Quizá"],
  espadas13:["Una pareja racional, quizá algo fría.","Autoridad y profesiones legales o técnicas.","Decide con la cabeza fría.","Sí"],
  oros0:["Una relación sólida que empieza con buen pie.","Una oferta de trabajo, un ingreso o un proyecto rentable.","Siembra ahora para cosechar.","Sí"],
  oros1:["Equilibrar la pareja con otras obligaciones.","Malabares con varias tareas o fuentes de ingresos.","Busca el equilibrio.","Quizá"],
  oros2:["Construir juntos con esfuerzo.","Trabajo en equipo reconocido.","Colabora y aprende.","Sí"],
  oros3:["Posesividad o miedo a perder al otro.","Ahorro y estabilidad; cuidado con la rigidez.","Asegura sin aferrarte.","Quizá"],
  oros4:["Sentirse fuera o carencias en la relación.","Dificultades económicas pasajeras.","Apóyate en los demás: pedir ayuda también es fuerza.","No"],
  oros5:["Generosidad mutua en el amor.","Ayuda, préstamos o un reparto justo.","Da y deja que te den.","Sí"],
  oros6:["Una relación que necesita tiempo para dar fruto.","Esperar el resultado de una inversión o un esfuerzo.","Paciencia: la cosecha llega.","Quizá"],
  oros7:["Trabajar la relación día a día.","Aprendizaje, oficio y dedicación.","Mejora con constancia.","Sí"],
  oros8:["Amor propio e independencia.","Éxito económico merecido.","Disfruta de lo que has logrado.","Sí"],
  oros9:["Familia, compromiso y raíces.","Estabilidad económica y patrimonio.","Piensa a largo plazo.","Sí"],
  oros10:["Un amor que empieza despacio y seguro.","Formación, prácticas o una oportunidad nueva.","Estudia y prepárate.","Sí"],
  oros11:["Una pareja fiel y constante, aunque poco romántica.","Trabajo constante y fiable.","Sigue paso a paso.","Sí"],
  oros12:["Un amor cálido y protector.","Gestión práctica, trabajo desde casa o tareas de cuidado.","Cuida tu bienestar material.","Sí"],
  oros13:["Una pareja estable y protectora.","Éxito empresarial y buena gestión.","Administra con sabiduría.","Sí"],
};
const NUM = ["el inicio y la semilla de todo","la dualidad y el encuentro","el crecimiento y la expresión","la estabilidad y la estructura","la crisis y el cambio","la armonía tras la prueba","la evaluación y la estrategia","el movimiento y el poder","la culminación","el cierre de un ciclo","la curiosidad y el aprendizaje","la acción y el impulso","el dominio interior","el dominio exterior y la autoridad"];
const SUIT_ART = { copas: "las Copas", bastos: "los Bastos", espadas: "las Espadas", oros: "los Oros" };

// --- Utilidades ---------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
for (const c of DECK) c.slug = slug(c.name);

function intro(c) {
  if (c.type === "major") return `${c.name} es el arcano mayor número ${c.num} (${c.roman}) del tarot. Los arcanos mayores hablan de las grandes lecciones y etapas de la vida, y esta carta representa ${c.kw.replace(/ · /g, ", ")}.`;
  const s = SUITS[c.suit];
  return `${c.name} pertenece a los arcanos menores, al palo de ${s.name}, asociado al elemento ${s.elem} y a ${s.area}. ${c.rank < 10 ? "Su número simboliza" : "Como figura de la corte, encarna"} ${NUM[c.rank]}. Sus palabras clave: ${c.kw.replace(/ · /g, ", ")}.`;
}

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.6;color:#efe6d2;background:radial-gradient(1000px 600px at 50% -10%,#2a1f5c 0%,transparent 60%),#0b0a1a;min-height:100vh}
a{color:#f3d99b}.wrap{max-width:760px;margin:0 auto;padding:18px 18px 50px}header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:10px}
.logo{font-family:Cinzel,serif;letter-spacing:.18em;font-size:19px;color:#f3d99b;text-decoration:none}.nav{font-family:Cinzel,serif;font-size:12px;letter-spacing:.1em;border:1px solid rgba(216,180,106,.4);border-radius:30px;padding:6px 12px;text-decoration:none}
.crumbs{font-size:15px;color:#a79fc0;margin:6px 0 14px}.crumbs a{color:#a79fc0}
h1,h2{font-family:Cinzel,serif;font-weight:600;letter-spacing:.05em;color:#f3d99b}h1{font-size:clamp(24px,6vw,34px);line-height:1.25;text-align:center}
h2{font-size:17px;margin:26px 0 6px}.kw{text-align:center;color:#a79fc0;font-style:italic;margin:6px 0 14px}
.hero{display:flex;gap:16px;justify-content:center;margin:18px 0}.hero figure{width:150px;text-align:center}.hero svg{width:100%;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.6)}.hero figcaption{font-size:14px;color:#a79fc0;margin-top:6px}.rot svg{transform:rotate(180deg)}
.box{background:rgba(20,18,48,.72);border:1px solid rgba(216,180,106,.22);border-radius:16px;padding:6px 20px 18px;margin-top:16px}
.yn{display:inline-block;font-family:Cinzel,serif;font-size:14px;letter-spacing:.12em;padding:4px 14px;border-radius:20px;border:1px solid #d8b46a;color:#f3d99b}
.cta{text-align:center;margin:28px 0 6px}.btn{display:inline-block;font-family:Cinzel,serif;letter-spacing:.12em;font-size:14px;background:linear-gradient(180deg,#e7c77f,#b98d3e);color:#1b1430;border-radius:40px;padding:13px 26px;font-weight:700;text-decoration:none}
.pn{display:flex;justify-content:space-between;gap:10px;margin-top:26px;font-size:16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px;margin-top:10px}
.grid a{text-decoration:none;text-align:center;font-size:14px;color:#efe6d2;line-height:1.25}.grid svg{width:100%;border-radius:7px;box-shadow:0 4px 14px rgba(0,0,0,.5);margin-bottom:4px}
footer{text-align:center;color:#a79fc0;font-size:14px;font-style:italic;margin-top:36px}`;

function page({ title, desc, canonical, body }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="es_ES">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="wrap">
<header><a class="logo" href="/">☾ ARCANA</a><a class="nav" href="/">Haz tu tirada</a></header>
${body}
<footer>Arcana es una herramienta de reflexión y entretenimiento. Ninguna lectura sustituye el consejo de un profesional.</footer>
</div></body></html>`;
}

function cardPage(c, i) {
  const [amor, trabajo, consejo, yn] = EXTRA[c.id];
  const prev = DECK[(i + DECK.length - 1) % DECK.length], next = DECK[(i + 1) % DECK.length];
  const url = `${SITE}/cartas/${c.slug}/`;
  const title = `${c.name} en el tarot: significado, invertida, amor y trabajo`;
  const desc = `Significado de ${c.name} en el tarot al derecho e invertida, en el amor, el trabajo y como consejo. ¿Sí o no? ${c.up}`.slice(0, 158);
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: title, description: desc, inLanguage: "es", mainEntityOfPage: url, publisher: { "@type": "Organization", name: "Arcana" } };
  const body = `<nav class="crumbs"><a href="/">Inicio</a> › <a href="/cartas/">Significado de las cartas</a> › ${esc(c.name)}</nav>
<h1>${esc(c.name)}</h1><p class="kw">${esc(c.kw)}</p>
<div class="hero"><figure>${cardSVG(c)}<figcaption>Al derecho</figcaption></figure><figure class="rot">${cardSVG(c)}<figcaption>Invertida</figcaption></figure></div>
<div class="box">
<h2>Qué representa</h2><p>${esc(intro(c))}</p>
<h2>Significado al derecho</h2><p>${esc(c.up)}</p>
<h2>${esc(c.name)} invertida</h2><p>${esc(c.rev)}</p>
<h2>En el amor</h2><p>${esc(amor)}</p>
<h2>En el trabajo y el dinero</h2><p>${esc(trabajo)}</p>
<h2>Como consejo</h2><p>${esc(consejo)}</p>
<h2>¿Sí o no?</h2><p><span class="yn">${yn.toUpperCase()}</span>&nbsp; En las tiradas de sí o no, ${esc(c.name)} ${yn === "Sí" ? "es una respuesta favorable" : yn === "No" ? "suele indicar que no es el momento" : "deja la respuesta abierta: depende de lo que hagas"}.</p>
</div>
<div class="cta"><p style="margin-bottom:12px">¿Te ha salido ${esc(c.name)}? Descubre qué te dice junto a las demás cartas.</p><a class="btn" href="/">Haz tu tirada gratis</a></div>
<div class="pn"><a href="/cartas/${prev.slug}/">← ${esc(prev.name)}</a><a href="/cartas/${next.slug}/">${esc(next.name)} →</a></div>
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  return page({ title, desc, canonical: url, body });
}

function indexPage() {
  const groups = [["Arcanos mayores", DECK.filter((c) => c.type === "major")],
    ...Object.keys(SUITS).map((s) => [`Palo de ${SUITS[s].name}`, DECK.filter((c) => c.suit === s)])];
  const body = `<nav class="crumbs"><a href="/">Inicio</a> › Significado de las cartas</nav>
<h1>Significado de las 78 cartas del tarot</h1>
<p class="kw">Arcanos mayores y menores, al derecho e invertidos, en el amor y en el trabajo</p>
${groups.map(([t, cs]) => `<h2>${t}</h2><div class="grid">${cs.map((c) => `<a href="/cartas/${c.slug}/">${cardSVG(c)}${esc(c.name)}</a>`).join("")}</div>`).join("\n")}
<div class="cta"><a class="btn" href="/">Haz tu tirada gratis</a></div>`;
  return page({ title: "Significado de las cartas del tarot: las 78 cartas explicadas | Arcana",
    desc: "Guía completa del significado de las 78 cartas del tarot: arcanos mayores y menores, al derecho e invertidas, en el amor, el trabajo y como consejo.",
    canonical: `${SITE}/cartas/`, body });
}

// --- Escribir ---------------------------------------------------------------
const out = path.join(ROOT, "cartas");
fs.rmSync(out, { recursive: true, force: true });
DECK.forEach((c, i) => {
  if (!EXTRA[c.id]) throw new Error("Falta EXTRA para " + c.id);
  fs.mkdirSync(path.join(out, c.slug), { recursive: true });
  fs.writeFileSync(path.join(out, c.slug, "index.html"), cardPage(c, i));
});
fs.writeFileSync(path.join(out, "index.html"), indexPage());
const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, `${SITE}/cartas/`, ...DECK.map((c) => `${SITE}/cartas/${c.slug}/`)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Generadas ${DECK.length} páginas de cartas + índice + sitemap (${urls.length} URLs).`);
