# Plan nutri

App para armar platos según el plan nutricional y la tabla de equivalencias.

**Link:** https://emanuelramponi.github.io/plan_nutri/

## Estructura

- `data/plan.json`: plan, alimentos y equivalencias. La app lo lee directo del repo, así que editarlo no requiere volver a publicar.
- `src/lib/plato.ts`: lógica para armar y calcular el plato.
- `src/components/`: componentes de la interfaz.

## Desarrollo

```bash
npm install
npm run dev
```

## Publicación

Cada push a `main` publica en GitHub Pages (`.github/workflows/deploy.yml`).
