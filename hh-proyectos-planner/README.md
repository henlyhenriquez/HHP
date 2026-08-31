# HH Proyectos · Planner

Tablero tipo Trello con la identidad de marca de HH Proyectos (Arquitectura · Gerencia Técnica).

## Uso

Abre `index.html` en el navegador (doble clic, o sirviendo la carpeta con cualquier servidor estático):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

No requiere backend ni instalación: todo el estado (tableros, columnas, tarjetas) se guarda en `localStorage` del navegador.

## Funciones

- Varios tableros, cada uno con sus propias columnas y tarjetas.
- Columnas editables: crear, renombrar, eliminar.
- Tarjetas con título, descripción, fecha límite, etiqueta y responsable.
- Arrastrar y soltar tarjetas entre columnas.
- Buscador de tarjetas por texto.
- Barra de progreso según tarjetas en la última columna ("Terminado").

## Marca

- Colores: Grafito `#2A2D31`, Verde Bosque `#2F5E43`, Gris Claro `#D9D9D9`, Marfil `#F5F5F2`.
- Tipografía: Work Sans (Google Fonts), como alternativa abierta a Neue Haas Grotesk / Avenir Next / Gotham.
- Logo en `assets/logo.svg`, recreado en SVG a partir del isotipo circular "HH" con acento verde. Si tienes el archivo original del logo, reemplaza `assets/logo.svg` (o los `<img src="assets/logo.svg">` en `index.html`) por tu archivo definitivo.
