# La web se escribe en JSX dentro del propio HTML —que es lo que la hace editable a
# mano, sin montar un proyecto entero— pero el visitante ya NO la compila: eso se hace
# aquí, una vez, al construir la imagen. Antes cada visita se descargaba Babel y
# compilaba 145 KB de JSX en el móvil de la persona antes de poder pintar nada.
FROM node:20-alpine AS compilar
WORKDIR /sitio
COPY . .
RUN npm install --prefix build --no-audit --no-fund \
 && node build/compilar.mjs . \
 && rm -rf build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilar /sitio /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
