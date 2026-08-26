# CV + Portafolio bilingüe

Sitio estático de mi, desarrollador full-stack especializado en automatización, IA local y datos. Español vive en `/` e inglés en `/en/`.

## Casos publicados

- Caso insignia: LocalForge AI Lab, candidato local `v1.0.0-rc.1` con evidencia de producción y publicación pendiente.
- Principales: RutaFactura, ReporteEnerg y VuelaFácil Familia.
- Complementarios: Control de Alojamiento y automatizaciones n8n.
- Credenciales verificables: IBM Generative AI Fundamentals, capstone de datos con Python de University of Michigan y tres cursos de ciberseguridad de Google.

## Desarrollo local

```bash
npm ci
npm run build
npm run check
```

El generador Node sin framework produce `dist/` con 14 páginas localizadas, un 404 dedicado, metadatos sociales, `hreflang`, canonical, sitemap y robots. `npm run check` valida paridad ES/EN, enlaces internos, imágenes, sitemap y archivos descargables.

`scripts/build_cv.py` genera los DOCX editables y compatibles con ATS en `cv-source/`; los PDF de `public/cv/` se exportan manualmente desde Word o LibreOffice. Ambos formatos incluyen solamente LocalForge, RutaFactura y ReporteEnerg. `cv-source/` permanece fuera de Git para evitar publicar metadatos editables.

## Editar contenido

Los textos del sitio, proyectos, certificaciones y etiquetas bilingües viven en `content/site.mjs`. Después de cualquier cambio ejecuta `npm test`. Para regenerar los DOCX usa `npm run cv` y revisa visualmente cada página antes de volver a exportar los PDF.

## Publicación

GitHub Actions construye y valida el sitio antes de desplegarlo en GitHub Pages. Los repositorios de aplicaciones se mantienen separados y se enlazan desde sus casos de estudio.

No se publican credenciales, bases de datos, documentos reales, rutas locales ni archivos de depuración.

## Licencias

El código del generador se publica bajo MIT. El CV, los textos personales, certificados, capturas y demás contenido de `content/` y `public/` no se conceden bajo esa licencia; consulta `CONTENT_LICENSE.md`.
