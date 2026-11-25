# Arcana · Web de tarot con IA

## Contenido
- `index.html` — toda la web (78 cartas, 7 tiradas, carta natal, animaciones, historial).
- `astronomy.browser.min.js` — librería de cálculo astronómico (Astronomy Engine, licencia MIT) para la carta natal.
- `netlify/functions/lectura.mjs` — función que llama a la IA (Claude) sin exponer tu clave.
- `netlify.toml` — configuración de Netlify.

## Publicar en Netlify
**Ojo:** el "arrastrar y soltar" de Netlify solo sube archivos estáticos y NO activa la función de IA.
Usa una de estas dos vías:

1. **GitHub** (recomendado): sube esta carpeta a un repositorio y en Netlify elige
   *Add new site → Import an existing project*.
2. **Netlify CLI**: en la carpeta, `npm i -g netlify-cli`, luego `netlify login` y `netlify deploy --prod`.

## Activar la IA
1. Crea una clave en https://console.anthropic.com (requiere añadir saldo; se paga por uso).
2. En Netlify: *Site configuration → Environment variables* → añade `ANTHROPIC_API_KEY` con tu clave.
3. (Opcional) `ANTHROPIC_MODEL` = `claude-haiku-5-5` para gastar menos. Por defecto usa `claude-sonnet-5-5`.
4. Vuelve a desplegar.

Sin clave o si la IA falla, la web sigue funcionando con una lectura basada en los significados tradicionales.

## Coste orientativo
Cada lectura son unos 1.000–2.500 tokens. Como referencia, con Haiku sale en torno a un euro (o menos) cada cien lecturas y con Sonnet unas tres veces más; revisa los precios actuales en la web de Anthropic.
Pon un límite de gasto mensual en la consola de Anthropic por si la web se hace popular.

## Páginas de significado de las cartas (SEO)
- `cartas/` contiene una página por carta (`/cartas/cinco-de-copas/`) y un índice (`/cartas/`).
- `sitemap.xml` y `robots.txt` ayudan a Google a encontrarlas.
- Se generan con `node scripts/generar-cartas.mjs` a partir de los datos de `index.html`.
  Si cambias significados o el diseño de las cartas, vuelve a ejecutarlo.
- Para acelerar la indexación: da de alta la web en Google Search Console y envía `sitemap.xml`.
