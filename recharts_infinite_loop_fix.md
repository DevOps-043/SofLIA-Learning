# Solución: Infinite Loop en Recharts ("Maximum update depth exceeded")

## 📌 Descripción del Problema
Al navegar a la pestaña de **Reportes** o **Dashboard** dentro del `Business Panel`, la aplicación colapsa mostrando una pantalla roja de Next.js con el error:
> **`Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState...`**

En el *Call Stack* de la imagen se observa que el bucle ocurre dentro de `react-redux/dist/react-redux.mjs` y `@reduxjs/toolkit/dist/redux-toolkit.modern.mjs`.

### ¿Por qué aparece Redux si el proyecto usa Zustand?
El proyecto utiliza Zustand para el manejo global del estado. Sin embargo, la librería de gráficos **Recharts (v2.x)** utiliza internamente `react-redux` y `@reduxjs/toolkit` para manejar el estado de sus componentes interactivos (como el Tooltip, los Ejes y el ResponsiveContainer).

## 🔍 Causa Raíz (Root Cause)
El bucle infinito es provocado por una combinación letal muy documentada en React 18 + Recharts:

1. **Recreación de Arreglos por Referencia**: En `BusinessReportsAnalytics.tsx`, los datos pasados a los gráficos se estaban mapeando directamente en el cuerpo del componente:
   ```tsx
   // ❌ MAL: Crea un NUEVO espacio en memoria en cada render
   const chartData = data.map(item => ({ ...item, label: labelFormatter(item) }))
   
   return <RechartsBarChart data={chartData} />
   ```
2. **Ciclo de Re-renderizado (`ResponsiveContainer`)**: Cuando `<ResponsiveContainer>` detecta su tamaño, o cuando un usuario interactúa con el gráfico, el componente padre se re-renderiza.
3. Al re-renderizarse, se genera un **nuevo arreglo `chartData`** (nueva referencia en memoria).
4. Recharts detecta que `props.data` cambió, así que hace un `dispatch` en su Redux interno para actualizar el gráfico.
5. Ese `dispatch` obliga al componente a actualizarse de nuevo, lo que reinicia el ciclo desde el paso 2... **Bucle Infinito**.

## 🛠️ Solución a Implementar (Para Codex)

Para arreglar este problema sin afectar el diseño, debes aplicar las siguientes refactorizaciones en el archivo `apps/web/src/features/business-panel/components/BusinessReportsAnalytics.tsx`:

### 1. Memorizar las funciones formateadoras (`useCallback`)
Los `labelFormatters` que se pasan a los gráficos no deben ser funciones anónimas inline, deben estar memorizados:

```tsx
// ✅ BIEN: Función memorizada que no cambia entre renders
const formatAgeBands = useCallback(
  (item: ReportsAnalyticsBreakdownItem) => translateDimension(t, 'ageBands', item), 
  [t]
)
const formatGender = useCallback(
  (item: ReportsAnalyticsBreakdownItem) => translateDimension(t, 'gender', item), 
  [t]
)
// ... (hacer lo mismo para formatProgress y formatJobTitles)
```

### 2. Memorizar los Datos del Gráfico (`useMemo`)
Dentro del componente `BreakdownCard`, el arreglo `chartData` debe ser memorizado para conservar su referencia en memoria a menos que cambie la data real:

```tsx
// ✅ BIEN: El arreglo mantiene la misma referencia si los datos no cambian
const chartData = useMemo(() => {
  return data
    .map((item, index) => ({
      ...item,
      label: labelFormatter(item),
      fill: theme.chartColors[index % theme.chartColors.length],
    }))
    .filter((item) => item.value > 0)
}, [data, theme.chartColors, labelFormatter])
```

### 3. Memorizar en `SegmentComparisonPanel`
Se debe aplicar la misma lógica a `rows` y `chartRows` en el panel de segmentos:

```tsx
// ✅ BIEN: Generar las filas usando useMemo
const { rows, chartRows } = useMemo(() => {
  const computedRows = [
     // ... lógica original de data.segments.map(...)
  ].sort((a, b) => b.users - a.users || b.qualityScore - a.qualityScore).slice(0, 8)

  const computedChartRows = computedRows.slice(0, 6).map((row) => ({
    ...row,
    shortLabel: truncateLabel(row.label, 18),
  }))

  return { rows: computedRows, chartRows: computedChartRows }
}, [data.segments, t])
```

### 4. Memorizar los Pasos del Tour de Joyride
Como bonificación de rendimiento y prevención de bucles, los pasos del tutorial no deben llamarse libremente en el render:

```tsx
// ❌ MAL
steps: getAdminReportsSteps(baseT)

// ✅ BIEN
const tourSteps = useMemo(() => getAdminReportsSteps(baseT), [baseT])
// ...
steps: tourSteps
```

## 🏁 Resultado Esperado
Una vez aplicados estos `useMemo` y `useCallback`, las referencias de los arreglos se mantendrán estables. Recharts no detectará "nuevos datos" fantasma, su estado interno (Redux) permanecerá quieto y el bucle infinito desaparecerá por completo, permitiendo que la pestaña "Reportes" y el Dashboard carguen instantáneamente y sin errores de profundidad máxima.
