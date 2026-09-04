#!/bin/sh
# Reemplaza placeholders con variables de entorno en los HTML y en el JS compilado.
# Se ejecuta al arrancar el contenedor, antes de iniciar nginx.
#
# Ojo: desde que el JSX se compila al construir la imagen, las claves ya NO viven
# solo en los .html — viven en /js/*.js. Si aquí solo se tocaran los HTML, la web
# arrancaría con "__SUPABASE_URL__" de dirección y no diría ni una palabra.

# Acepta tanto SUPABASE_URL como VITE_SUPABASE_URL
SB_URL="${SUPABASE_URL:-$VITE_SUPABASE_URL}"
SB_KEY="${SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}"

if [ -z "$SB_URL" ] || [ -z "$SB_KEY" ]; then
  echo "[entrypoint] AVISO: faltan SUPABASE_URL o SUPABASE_ANON_KEY. Los formularios no van a funcionar."
fi

find /usr/share/nginx/html -maxdepth 2 \( -name '*.html' -o -name '*.js' \) -print | while read -r f; do
  sed -i "s|__SUPABASE_URL__|${SB_URL}|g" "$f"
  sed -i "s|__SUPABASE_ANON_KEY__|${SB_KEY}|g" "$f"
done

# Si queda algún marcador sin sustituir, es que se ha escapado un fichero: mejor
# saberlo en el arranque que descubrirlo por un formulario que no envía.
pendientes=$(find /usr/share/nginx/html -maxdepth 2 \( -name '*.html' -o -name '*.js' \) -exec grep -l "__SUPABASE_URL__\|__SUPABASE_ANON_KEY__" {} + 2>/dev/null | head -5)
if [ -n "$pendientes" ]; then
  echo "[entrypoint] AVISO: quedan marcadores sin sustituir en:"
  echo "$pendientes"
fi

echo "[entrypoint] Variables inyectadas correctamente"

# Arranca nginx en primer plano
exec nginx -g 'daemon off;'
