// Compila, al construir la imagen, el JSX que hasta hoy se compilaba EN EL NAVEGADOR.
// ---------------------------------------------------------------------------------
// Estas páginas son React escrito a mano dentro del propio HTML, en un
// <script type="text/babel">. Para que eso funcione, el navegador de cada visitante
// se descargaba Babel (~1,7 s) y compilaba 145 KB de JSX (~0,7 s) ANTES de poder
// pintar nada. Ese era el rato en el que se veía otra cosa.
//
// Aquí se hace una vez, al desplegar, y el visitante recibe JavaScript ya listo.
//
// La forma de trabajar NO cambia: se sigue editando el JSX dentro del HTML, que es
// lo que hace que estas páginas se puedan tocar sin montar un proyecto entero. Lo
// que cambia es lo que se sirve.
//
// Si un día una página deja de tener el bloque de JSX, este script FALLA a
// propósito y el despliegue no sale: es preferible a publicar una página muerta.

import { transformSync } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2] || '.';

// Este script REESCRIBE los HTML que toca: les quita el JSX y les deja un <script src>.
// Sobre el repo eso destruiria el fuente sin avisar, asi que se niega a correr donde
// haya un .git. Dentro de la imagen no lo hay (lo excluye .dockerignore) y corre solo.
if (existsSync(join(raiz, '.git')) && !process.argv.includes('--si-quiero-romper-el-fuente')) {
  console.error('[compilar] ERROR: ' + raiz + ' es un repositorio. Este script reescribe los HTML en el sitio;');
  console.error('           esta pensado para correr DENTRO de la imagen, sobre una copia.');
  console.error('           Para probarlo: copia el sitio a otra carpeta y pasale esa ruta.');
  process.exit(1);
}

const salida = join(raiz, 'js');
mkdirSync(salida, { recursive: true });

const RE_JSX = /[ \t]*<script type="text\/babel">([\s\S]*?)<\/script>\r?\n?/;
const RE_BABEL_CDN = /[ \t]*<script src="https:\/\/unpkg\.com\/@babel\/standalone[^"]*"[^>]*><\/script>\r?\n?/g;
// react, react-dom y supabase-js dejan de bloquear el parseo del HTML. Entre scripts
// `defer` se respeta el orden del documento, así que la app sigue arrancando después
// de sus librerías. Tailwind NO se toca: si llegara tarde, la página real se vería
// un instante sin estilos, que es el problema que estamos quitando.
const RE_UMD = /(<script src="https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net)\/[^"]*(?:react|react-dom|supabase-js)[^"]*"[^>]*?)(><\/script>)/g;

let paginas = 0;

for (const fichero of readdirSync(raiz).filter(n => n.endsWith('.html')).sort()) {
  const ruta = join(raiz, fichero);
  let html = readFileSync(ruta, 'utf8');
  const bloque = html.match(RE_JSX);
  if (!bloque) continue;

  const jsx = bloque[1];
  const { code } = transformSync(jsx, {
    loader: 'jsx',
    target: 'es2019',
    jsx: 'transform',
    sourcefile: fichero,
  });

  if (!code.trim()) {
    console.error(`[compilar] ERROR: ${fichero} ha compilado a nada.`);
    process.exit(1);
  }

  // Envuelto en una función. Babel aislaba el bloque sin que se notara; un script
  // suelto no, y sus `const` de primer nivel chocan con los globales de las
  // librerías: `encuentro.html` declara `const supabase` y el UMD de supabase-js
  // ya ocupa ese nombre — la página se quedaba en blanco con
  // «Identifier 'supabase' has already been declared». Ninguna página usa
  // manejadores `onclick=` en el HTML, así que nada de fuera necesita ver estos
  // nombres (comprobado antes de envolver, no supuesto).
  const envuelto = `(function () {\n${code}\n})();\n`;
  // El entrypoint sustituye estos marcadores al arrancar el contenedor. Si el JSX los
  // traía, el JS compilado tiene que seguir trayéndolos o la página arranca sin base
  // de datos y sin decirlo.
  for (const marcador of ['__SUPABASE_URL__', '__SUPABASE_ANON_KEY__']) {
    if (jsx.includes(marcador) && !envuelto.includes(marcador)) {
      console.error(`[compilar] ERROR: ${fichero} ha perdido ${marcador} al compilar.`);
      process.exit(1);
    }
  }

  // El nombre lleva el hash del contenido porque nginx sirve los .js con
  // `immutable` a 30 días: sin hash, un despliegue nuevo convive con el JS viejo.
  const hash = createHash('sha1').update(envuelto).digest('hex').slice(0, 10);
  const nombre = `${fichero.replace(/\.html$/, '')}.${hash}.js`;
  writeFileSync(join(salida, nombre), envuelto);

  const fin = html.includes('\r\n') ? '\r\n' : '\n';
  html = html.replace(RE_JSX, `    <script src="/js/${nombre}" defer></script>${fin}`);
  html = html.replace(RE_BABEL_CDN, '');
  html = html.replace(RE_UMD, (todo, cabeza, cola) =>
    cabeza.includes(' defer') ? todo : `${cabeza} defer${cola}`);
  writeFileSync(ruta, html);

  paginas++;
  console.log(`[compilar] ${fichero} → js/${nombre}  (${(jsx.length / 1024).toFixed(0)} KB de JSX → ${(code.length / 1024).toFixed(0)} KB de JS)`);
}

if (!paginas) {
  console.error('[compilar] ERROR: ninguna página traía JSX. O ha cambiado el formato, o falta la copia de los ficheros.');
  process.exit(1);
}
console.log(`[compilar] ${paginas} páginas compiladas. El navegador ya no compila nada.`);
