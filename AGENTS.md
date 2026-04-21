# Proyecto DataIot React - Notas para Agentes

## Gestor de paquetes
- **USAR SIEMPRE `yarn`** en vez de `npm`
- No usar `npm install`, `npx`, etc. Usar `yarn add`, `yarn`, `yarn dlx` respectivamente

## Proyecto React
- Framework: React (probablemente con Vite basado en la estructura común)
- Tipo: Dashboard/panel de control IoT

## Comandos comunes
```bash
yarn dev      # Iniciar servidor de desarrollo
yarn build    # Compilar para producción
yarn preview  # Previsualizar build
yarn lint     # Verificar código
```

## Estructura típica
- `src/` - Código fuente
- `src/components/` - Componentes React
- `src/pages/` - Páginas/rutas
- `src/hooks/` - Hooks personalizados
- `src/services/` - Llamadas API/servicios
- `src/types/` - Tipos TypeScript

## Notas importantes
- Verificar package.json para dependencias específicas
- Si hay errores de TypeScript, revisar configuración en tsconfig.json
