# Mercado Trivia 2.0

Plataforma educativa de DomUp para vendedores de Mercado Libre. Incluye un modo de
práctica anónimo y campañas verificadas para MELIXP Chile y Argentina.

## Estado

La base técnica está en construcción. Las campañas nacen en estado `draft` y el banco
inicial queda en `review`; ninguna participación competitiva se habilita por accidente.

## Stack

- Next.js App Router, React y TypeScript.
- Supabase PostgreSQL, Auth y Row Level Security como backend y fuente de datos
  exclusivos.
- Vercel para previews y producción.
- OAuth mediante aplicaciones convencionales de Mercado Libre por país; no se usa
  el modelo de aplicación promocional.
- WhatsApp OTP mediante Supabase y un proveedor compatible.

## Desarrollo local

1. Usar Node.js 20.9 o superior.
2. Copiar las variables documentadas en `.env.example` a `.env.local`.
3. Crear un proyecto local o remoto de Supabase y aplicar las migraciones.
4. Ejecutar `npm install`.
5. Ejecutar `npm run dev`.

Comprobaciones obligatorias:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` y secretos OAuth son exclusivamente server-side.
- Las preguntas correctas no tienen políticas de lectura pública.
- El score se calcula en PostgreSQL mediante una función disponible sólo para
  `service_role`.
- OAuth valida estado, país, seller y propiedad de la publicación antes de solicitar
  la verificación de WhatsApp.
- El modo campaña exige identidad, publicación, consentimiento y una participación
  única por campaña.

La credencial histórica del backend retirado debe revocarse. Su eliminación del
historial Git se realizará como una operación separada y controlada antes de publicar
el repositorio.

## Datos

- `supabase/migrations`: esquema, RLS y scoring transaccional.
- `supabase/seed.sql`: primer lote de 25 preguntas en revisión.
- `legacy/question-bank-2025.csv`: artefacto de consulta del banco anterior; no se
  importa ni se consulta durante build o runtime.
- `docs/academic-model.md`: contrato pedagógico y criterios de aprobación.

El control `npm run check:backend` evita que código, configuración o dependencias
vuelvan a conectarse con el backend retirado.
