# 🐼 PandaScan Converter (Beta)

**Transform images into professional PDFs instantly** - Perfect for comics, documents, and photo collections.

*powered by iscodev *

![Astro](https://img.shields.io/badge/astro-5.13.3-blue)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-4.1.12-blue)
![TypeScript](https://img.shields.io/badge/typescript-ready-green)

## ⚡ Quick Start

1. **Upload** images (drag & drop or URLs)
2. **Reorder** by dragging table rows  
3. **Configure** quality and comic style
4. **Download** your professional PDF

**Live Demo**: Visit [pandascan.online](https://pandascan.online) 🚀

## 🎯 Core Features

- 📁 **Multi-Upload**: Drag & drop files + URL support
- � **Drag Reorder**: Change image order easily
- 📏 **Smart Quality**: SD/HD with comic-optimized layouts
- 🎨 **Professional Output**: A4, Letter, Legal, A3, Custom sizes
- 🔒 **Watermark**: Branded PDFs (always included)

## �️ Tech Stack

**Framework**: Astro 5.13.3 • **UI**: Tailwind + shadcn/ui • **PDF**: jsPDF • **Images**: browser-image-compression

## 🚀 Installation

```bash
bun install && bun run dev
```

## 📖 Usage Guide

### English 🇺🇸
1. Upload images by dragging files or adding URLs
2. Reorder by dragging rows in the table  
3. Configure settings (quality, comic style, etc.)
4. Download your professional PDF

**Perfect for**: Comics, documents, photo collections

### Español 🇪🇸  
1. Sube imágenes arrastrando archivos o agregando URLs
2. Reordena arrastrando filas en la tabla
3. Configura ajustes (calidad, estilo cómic, etc.)
4. Descarga tu PDF profesional

**Perfecto para**: Cómics, documentos, colecciones de fotos

## 🚀 Default Configuration

- **Style**: Comic mode (no spaces between images)
- **Quality**: Standard (SD) for lighter files
- **Watermark**: Always enabled (PandaScan Converter)
- **Image info**: Disabled by default
- **Page numbers**: Enabled by default

## 🔧 Error Handling

- **404 Pages**: Automatic redirect to main page
- **Corrupt images**: Automatically filtered
- **Load errors**: Automatic retries with visual feedback
- **Compatibility**: Works on all modern browsers
3. Configura ajustes (calidad, estilo cómic, etc.)
4. Descarga tu PDF profesional

**Perfecto para**: Cómics, documentos, colecciones de fotos

## ⚙️ Settings

| Feature | Options |
|---------|---------|
| **Quality** | SD (optimized) • HD (maximum) |
| **Page Format** | A4 • Letter • Legal • A3 • Custom |
| **Comic Style** | Standard • Comic Layout (optimized for reading) |
## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                    # UI components
│   └── ImageToPDFConverter.astro  # Main app
├── lib/utils.ts               # Utilities  
└── pages/index.astro          # Entry point
```

## 📱 Browser Support

Chrome 88+ • Firefox 85+ • Safari 14+

## 📄 License

MIT License

---

**Made with ❤️ by PandaScan** | Visit [pandascan.online](https://pandascan.online)
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
