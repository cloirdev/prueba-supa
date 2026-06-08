# 🏀 CB Jaca — Web Oficial

Sitio web oficial del **Club Baloncesto Jaca**, construido con Astro y React. Incluye noticias del club, información de equipos y un buscador integrado.

---

## ✨ Características

- 📰 **Noticias** — Sección de noticias y novedades del club
- 🏆 **Equipos** — Información sobre los equipos de la temporada
- ⛹️ **Jugadores** — Información sobre los jugadores del club con sus estadísticas por temporada
- 🆚 **Partidos** — Partidos con crónicas, estadísticas y galería de fotos
- 🔍 **Buscador** — Búsqueda integrada con React
- 🌙 **Tema oscuro/claro** — Preferencia guardada en `localStorage`
- 📱 **Diseño responsive** — Menú adaptado para móvil

---

## 🛠️ Stack tecnológico

| Tecnología                   | Uso                                         |
| ---------------------------- | ------------------------------------------- |
| [Astro](https://astro.build) | Framework principal y generación de páginas |
| [React](https://react.dev)   | Componentes interactivos (buscador, menú)   |
| CSS Variables                | Sistema de temas (claro/oscuro)             |

---

## 🚀 Instalación y uso

### Prerrequisitos

- Node.js 18+
- npm o pnpm

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/cb-jaca.git
cd cb-jaca

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

El sitio estará disponible en `http://localhost:4321`.

### Otros comandos

```bash
npm run build    # Genera la build de producción en /dist
npm run preview  # Previsualiza la build localmente
```

---

## 📁 Estructura del proyecto

```
/
├── public/
│   └── escudo-naranja.png
├── src/
│   ├── components/
│   │   ├── Buscador.tsx       # Buscador (React)
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro       # Layout principal con nav
│   ├── pages/
│   │   ├── index.astro
│   │   ├── noticias/
│   │   └── equipos/
│   └── styles/
│       └── global.css
└── astro.config.mjs
```

---

## 🎨 Temas

El sitio soporta tema **claro** y **oscuro**. La preferencia se guarda automáticamente en `localStorage` y se aplica mediante el atributo `data-theme` en el elemento `<html>`.

Los colores principales se definen como variables CSS:

```css
--azul-oscuro: /* color de la barra de navegación */ --naranja:
  /* color de acento del club */;
```

---

## 📄 Licencia

Este proyecto es de uso interno del Club Baloncesto Jaca. Todos los derechos reservados.
