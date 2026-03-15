# Revisión exhaustiva de factibilidad — Monitor documental Mercado Libre

## 1) Diagnóstico general

**Veredicto:** el plan es **viable y bien orientado**, con una arquitectura incremental correcta para un MVP realista. Sin embargo, hoy está más fuerte en estrategia que en especificación operativa verificable. Para ejecutar sin sorpresas, hay que cerrar definiciones de: cumplimiento legal, canonización de URL, extracción robusta frente a front dinámico, contratos de calidad de datos, observabilidad, y criterios objetivos de severidad.

---

## 2) Lo que está bien (fortalezas)

### 2.1 Enfoque por fases
- Separar Fase 1 (captura confiable) de Fase 4 (IA) es una decisión correcta.
- Evita sobre-ingeniería temprana y reduce riesgo de construir “features bonitas” sin base limpia.

### 2.2 Modelo mental del problema
- Distingue adecuadamente entre **descargar HTML** y **detectar cambios útiles**.
- Reconoce explícitamente el problema de falsos positivos por ruido de frontend.

### 2.3 Diseño de persistencia
- Tablas propuestas (`doc_pages`, `doc_snapshots`, `doc_changes`, `crawl_runs`) cubren bien auditoría e histórico.
- Guardar crudo + normalizado es una buena práctica para trazabilidad y debugging.

### 2.4 Estrategia de operación
- Frecuencia sugerida (diaria + críticas) tiene buena relación costo/beneficio.
- Introduce priorización y cortesía de crawling, lo cual ayuda a estabilidad y sostenibilidad.

### 2.5 Orientación a negocio
- El plan conecta cambios documentales con impacto operativo, no solo con métricas técnicas.

---

## 3) Lo que está mal o débil (riesgos no resueltos)

### 3.1 Falta de estrategia de cumplimiento (legal/compliance)
- No define política de robots.txt, términos de uso, ni límites explícitos por dominio/ruta.
- Riesgo: bloqueo, incidentes reputacionales o limitaciones de continuidad operativa.

### 3.2 Clasificación de severidad poco formal
- Se proponen tipos A/B/C/D, pero faltan reglas determinísticas y medibles.
- Sin taxonomía operacional, la severidad puede volverse subjetiva y no confiable.

### 3.3 Normalización incompleta a nivel de contrato
- Dice “qué limpiar”, pero no define:
  - lista concreta de selectores a remover,
  - reglas de fallback,
  - tolerancia máxima de ruido aceptable,
  - tests de regresión del parser.

### 3.4 Falta de estrategia fuerte para contenido dinámico
- No está definido cómo manejar páginas con render JS parcial/total.
- Sin plan de fallback (HTTP estático -> navegador headless), puede perder cobertura.

### 3.5 Gobernanza de snapshots y costos
- Menciona retención, pero no especifica política (TTL, compresión, partición por fecha, archivado frío).
- Riesgo de crecimiento descontrolado de almacenamiento.

### 3.6 Ausencia de SLO/SLI de plataforma
- No define objetivos operativos concretos (éxito crawl, latencia, frescura, falsos positivos).
- Sin SLO, no hay criterio claro de “listo para producción”.

---

## 4) Lo que falta (gaps críticos)

## 4.1 Contratos de datos por entidad
Falta definir para cada tabla:
- campos obligatorios vs opcionales,
- constraints,
- índices,
- claves únicas compuestas,
- políticas de idempotencia por corrida.

## 4.2 Definición de URL canónica
Falta una RFC interna con reglas exactas:
- minúsculas/mayúsculas,
- trailing slash,
- query params permitidos,
- fragmentos,
- redirecciones 301/302,
- normalización por idioma.

## 4.3 Calidad de extracción
Falta establecer umbrales de aceptación:
- `% de texto principal extraído` esperado,
- `% de ruido residual` permitido,
- cobertura por módulo,
- score mínimo de parseo válido.

## 4.4 Observabilidad y alertado técnico
Falta plan de:
- logs estructurados,
- métricas (Prometheus/OTEL o equivalente),
- alertas de fallo de corrida,
- trazabilidad por `run_id` y `page_id`.

## 4.5 Seguridad y secretos
Falta política para:
- gestión de credenciales (Supabase keys),
- rotación,
- separación entorno dev/stage/prod,
- auditoría de accesos.

## 4.6 Entorno de pruebas reproducible
Falta definir:
- fixtures HTML versionados,
- pruebas offline del parser,
- pruebas e2e en subset de URLs reales,
- golden files para comparar diffs.

---

## 5) Oportunidades de mejora (alto impacto / bajo-medio esfuerzo)

1. **Scoring de cambio** en vez de solo etiquetas (0–100 + razón).  
2. **Diff semántico por bloques** (títulos, tablas, notas, código) para reducir ruido.  
3. **Rutas críticas con mayor frecuencia** (top 20 endpoints usados por negocio).  
4. **Control estadístico de ruido** por página (siempre ruidosa vs estable).  
5. **Panel de triage** con workflow: `new -> reviewed -> confirmed -> ignored`.  
6. **Reprocesamiento histórico** al mejorar parser (backfill controlado).  
7. **Modo shadow parser** para comparar parser nuevo vs actual antes de migrar.

---

## 6) Evaluación de factibilidad ajustada

- **Factibilidad técnica:** Alta, condicionada a resolver robustez de parseo dinámico y normalización contractual.
- **Factibilidad operativa:** Media-Alta, depende de buena observabilidad y triage humano simple.
- **Factibilidad económica:** Alta en MVP, Media en escala si no se controla retención.
- **Riesgo total:** Medio controlable.
- **Recomendación:** avanzar, pero con criterios de calidad operativos explícitos desde la Semana 1.

---

## 7) Plan de debugging/validación para comprobar que “todo funciona”

## 7.1 Principios
- Toda corrida debe ser **reproducible** (mismo input => mismo output esperado, salvo cambios remotos).
- Toda detección debe ser **explicable** (qué cambió, dónde, por qué se clasificó así).
- Todo fallo debe ser **trazable** por `run_id`.

## 7.2 Matriz de pruebas por etapa

### A) Descubrimiento de URLs
**Objetivo:** no perder páginas relevantes ni meter basura.

Checks:
- deduplicación correcta,
- exclusión de assets,
- inclusión de rutas válidas,
- estabilidad de inventario entre corridas.

Debug:
- guardar `discovered_urls_raw` y `discovered_urls_canonical` por run,
- reportar `% nuevas`, `% descartadas`, `% duplicadas`.

### B) Fetch HTTP
**Objetivo:** descargar con resiliencia.

Checks:
- status codes,
- retries/backoff,
- timeout controlado,
- response size razonable,
- detección de bloqueos (429/403).

Debug:
- log estructurado por request: `url`, `status`, `latency_ms`, `attempt`, `error_type`.

### C) Extracción y normalización
**Objetivo:** texto útil estable.

Checks:
- título presente,
- cuerpo mínimo (>N caracteres),
- tablas/notas extraídas cuando existan,
- reducción de ruido consistente.

Debug:
- persistir artefactos intermedios: `html_raw`, `html_canonical`, `text_clean`, `segments_json`.
- calcular score de extracción (0–1) y marcar outliers.

### D) Hashing y comparación
**Objetivo:** detectar cambios reales.

Checks:
- hashing determinístico,
- diff reproducible,
- no generar cambio cuando solo cambia ruido excluido,
- generar cambio cuando cambia contenido sustantivo.

Debug:
- guardar resumen de comparación por señal:
  - `hash_html_changed`,
  - `hash_clean_text_changed`,
  - `segment_delta_count`,
  - `table_delta_count`.

### E) Clasificación de severidad
**Objetivo:** priorizar bien.

Checks:
- reglas A/B/C/D determinísticas,
- consistencia entre corridas,
- precisión vs revisión humana.

Debug:
- para cada cambio, guardar `classification_reasons[]`.

### F) Persistencia
**Objetivo:** integridad e idempotencia.

Checks:
- no duplicar snapshots por misma versión,
- foreign keys válidas,
- inserciones atómicas por página/run.

Debug:
- constraints + transacciones,
- reporte de conflictos/upserts.

### G) Exposición/dashboard
**Objetivo:** revisión operativa útil.

Checks:
- filtros por módulo/severidad/fecha,
- vista diff legible,
- trazabilidad old/new snapshot.

Debug:
- tests de consultas principales,
- tiempos de respuesta de queries.

## 7.3 Pruebas de regresión obligatorias

1. **Fixture tests (offline):** HTML conocido con cambios sintéticos controlados.  
2. **Golden tests:** output esperado de normalización y clasificación.  
3. **Canary run (online):** 20 URLs estables + 10 ruidosas + 10 críticas.  
4. **Shadow run:** parser nuevo corre en paralelo sin impactar producción.  
5. **Backfill test:** re-procesar histórico chico para validar compatibilidad.

## 7.4 Indicadores de “listo para MVP”

- Crawl success rate >= 95%
- Parse success rate >= 90%
- Falsos positivos <= 15% (objetivo inicial)
- Cambios críticos con recall alto validado manualmente
- Corrida completa dentro de ventana operativa acordada

## 7.5 Checklist de salida a producción

- SLO/SLI definidos
- Alertas activas (fallo de corrida, caída de cobertura, error DB)
- Runbook de incidentes
- Política de retención activa
- Versionado de parser y migraciones de esquema
- Dashboard mínimo operativo

---

## 8) Plan de implementación corregido (4 semanas, práctico)

**Semana 1:** contrato de datos + canonización URL + crawler básico + fixtures.  
**Semana 2:** parser robusto + normalización + hashes + pruebas de regresión.  
**Semana 3:** diffs + clasificación determinística + dashboard mínimo + canary run.  
**Semana 4:** hardening + alertas + runbook + métricas + criterio go/no-go.

---

## 9) Preguntas aclaratorias (necesarias para subir certeza >95%)

1. ¿Cuál es el dominio/rango exacto a monitorear (solo `developers.mercadolibre.com` o también subdominios/regiones)?
2. ¿Quieren cobertura monoidioma (ES) o multidioma desde el MVP?
3. ¿Hay restricciones legales/compliance internas adicionales para scraping?
4. ¿Qué módulos son “críticos” para priorización inicial (top 20)?
5. ¿Cuál es el volumen esperado de URLs en fase 1 (aprox)?
6. ¿Qué tolerancia tienen a falsos positivos en el primer mes?
7. ¿Prefieren snapshots completos siempre o solo cuando cambia hash limpio?
8. ¿Existe ya un entorno Supabase (dev/stage/prod) o hay que crearlo?
9. ¿Quién hará la revisión humana de cambios y con qué SLA?
10. ¿Qué canal de alertas es prioritario (Slack, email, ambos)?
11. ¿Necesitan evidencia legal/auditable exportable (CSV/PDF) desde el MVP?
12. ¿Cuál es la ventana horaria ideal para corridas diarias?
13. ¿Qué presupuesto mensual objetivo tienen para infraestructura?
14. ¿Se acepta Playwright/headless como fallback si la extracción HTTP falla?
15. ¿Quieren integración posterior con mapa de impacto sobre servicios internos concretos?

---

## 10) Cierre con respuestas del equipo (certeza operativa >95%)

Con las respuestas recibidas, el plan queda ajustado de la siguiente manera:

### 10.1 Alcance funcional confirmado
- **Cobertura:** todas las páginas documentales públicas relevantes (sin recorte por módulo).
- **Idioma inicial:** español.
- **Objetivo de cobertura:** “todas” las URLs detectables bajo el dominio objetivo.
- **Revisor humano:** owner único (vos).
- **Canal de alertas:** email.
- **Exportables requeridos:** CSV + PDF + JSON.
- **Ventana de ejecución:** madrugada.
- **Roadmap posterior:** sí, integrar mapa de impacto sobre servicios internos.

### 10.2 Aclaraciones traducidas a decisiones técnicas

#### A) “No sé qué es snapshots completos”
**Definición simple:** un snapshot es una “foto” de cómo estaba una página en un momento dado.

**Decisión recomendada para MVP:**
- guardar snapshot completo solo cuando cambia el contenido limpio,
- y guardar metadato liviano diario aunque no cambie (status, latencia, fecha).

Esto reduce costo, mantiene trazabilidad y evita almacenar duplicados inútiles.

#### B) “¿Qué sería Playwright/headless?”
Es un navegador automatizado (sin interfaz) para páginas que no entregan bien el contenido vía HTTP puro.

**Decisión recomendada para MVP:**
- flujo principal: HTTP,
- fallback: headless solo en páginas que fallen extracción o score bajo.

Así se minimiza costo y complejidad.

#### C) “Existe Supabase, no sé si hay proyecto”
**Acción concreta:** validar en día 1 si ya existe proyecto activo con:
- base de datos accesible,
- claves de servicio segregadas por entorno,
- y backups habilitados.

Si no existe, crear `dev` y dejar `prod` listo antes de semana 2.

#### D) “Presupuesto: ¿de qué?”
El presupuesto se refiere a costo mensual de:
- base de datos,
- almacenamiento de snapshots,
- ejecución de jobs,
- alertas/email,
- observabilidad.

**Rango inicial sugerido para MVP:** bajo (controlado), con revisión a las 2 semanas usando métricas reales.

#### E) “Falsos positivos: ninguna tolerancia”
Operativamente “cero” no es realista en scraping documental.

**Traducción a objetivo medible MVP:**
- semana 1–2: <= 15%,
- semana 3: <= 8%,
- salida MVP: <= 5% con lista blanca de páginas ruidosas.

---

## 11) Plan de ejecución aterrizado con tus respuestas

### Semana 1 (fundaciones obligatorias)
1. Confirmar dominio exacto y reglas de crawling público.
2. Confirmar proyecto Supabase y credenciales.
3. Crear esquema SQL base (`doc_pages`, `doc_snapshots`, `doc_changes`, `crawl_runs`).
4. Definir canonización de URL para evitar duplicados.
5. Correr seed inicial en español y registrar inventario.

### Semana 2 (pipeline confiable)
1. Implementar extracción + normalización contractual.
2. Implementar hashes por capa (crudo/canónico/texto/segmentos).
3. Implementar diffs reproducibles por bloques.
4. Agregar fallback headless para casos con score bajo.

### Semana 3 (operación consultable en base)
1. Cargar histórico y dejarlo **consultable en base** por URL/módulo/fecha/severidad.
2. Dashboard mínimo de revisión para owner único.
3. Exportadores CSV/JSON (y reporte PDF semanal).
4. Envío de alertas por email en madrugada.

### Semana 4 (hardening + salida)
1. Ajustar reglas para bajar falsos positivos.
2. Definir runbook de errores y recuperación.
3. Cerrar criterios de aceptación MVP.
4. Congelar versión estable para fase operativa.

---

## 12) Plan de debugging final (práctico y ejecutable)

Además del plan por etapa ya definido, se recomienda esta rutina diaria:

1. Verificar corrida de madrugada (`status`, duración, páginas fallidas).
2. Revisar cambios detectados por severidad (alta -> media -> baja).
3. Validar top 20 cambios con diff lado a lado.
4. Etiquetar falsos positivos para recalibrar parser.
5. Emitir exportable diario JSON y semanal CSV/PDF.

### Comandos/checks sugeridos para operación técnica
- conteo de URLs activas vs crawladas por run,
- % éxito HTTP,
- % parse válido,
- % cambios clasificados,
- % alertas enviadas correctamente por email,
- tiempo total de corrida y costo estimado.

### Criterio de “funciona bien”
Se considera estable cuando durante 10 corridas seguidas:
- no hay caída de cobertura,
- no hay errores críticos de persistencia,
- clasificación consistente,
- y falsos positivos en rango objetivo.
