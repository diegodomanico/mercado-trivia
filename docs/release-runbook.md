# Runbook de lanzamiento MELIXP

## Fechas y capacidad objetivo

- Chile: 27/08/2026, capacidad mínima de 3.000 participantes.
- Argentina: 10/09/2026, capacidad mínima de 7.000 participantes.

## Beneficios y registro

- Más de 500 beneficios, exclusivamente bonificaciones y descuentos aplicables a
  servicios de DomUp; no se comunican como premios físicos ni dinero.
- Orden de registro: cuenta convencional de Mercado Libre, publicación activa propia,
  WhatsApp y aceptación legal.
- Las piezas deben informar vigencia, alcance, restricciones y forma de aplicación de
  cada bonificación o descuento.

## Puertas de salida

1. Credencial del backend retirado revocada y secretos fuera del historial activo.
2. Vercel y Supabase con proyectos separados para preview y producción.
3. Conciliación histórica confirmada: 92 filas fuente, 90 candidatas enlazadas y 20
   resultados privados; diferencias documentadas antes de retirar el origen.
4. Aplicación convencional OAuth de Mercado Libre compartida entre países y con redirect
   definitivo. PKCE debe coincidir con la configuración vigente de IACADEMY y no cambiarse
   sin probar sus integraciones existentes.
5. WhatsApp OTP operativo, con límites, CAPTCHA y presupuesto confirmado.
6. Manual de marca e insignias oficiales de Partner aplicados y aprobados por Diego Domanico.
7. Bases y privacidad publicadas, versionadas y aceptables desde la aplicación.
8. Mínimo de 125 preguntas elegibles por país, todas aprobadas por Diego Domanico.
9. Pruebas funcionales, seguridad, accesibilidad y carga aprobadas.
10. Campaña activada sólo después del ensayo general.

## Estrategia de validación por país

- Argentina es el tester funcional inicial para OAuth, callback, asociación del seller,
  propiedad de la publicación, WhatsApp, consentimiento y partida.
- La prueba argentina valida la aplicación IACADEMY y el flujo compartido, pero no
  certifica el dominio OAuth chileno, `site_id=MLC` ni una publicación `MLC` propia.
- Conseguir antes del 17/08/2026 un seller principal chileno con una publicación activa
  para ejecutar el flujo completo. No sirve una cuenta colaboradora.
- La salida de Chile queda bloqueada hasta documentar OAuth exitoso, seller `MLC`,
  publicación propia activa y regreso correcto al callback de producción.

## Chile · 27 de agosto de 2026

- Objetivo de capacidad: más de 3.000 participantes.
- Ensayo general: 21 al 23 de agosto.
- Congelamiento: 24 de agosto.
- Ventana de contingencia: 25 y 26 de agosto.

## Argentina · 10 de septiembre de 2026

- Objetivo de capacidad: más de 7.000 participantes.
- Incorporar correcciones verificadas del evento de Chile.
- Ensayo general: 5 al 7 de septiembre.
- Congelamiento: 8 de septiembre.

## Durante el evento

- Observar errores, latencia, OTP enviados, OAuth completados y partidas finalizadas.
- No cambiar preguntas ni reglas de scoring durante una campaña activa.
- Pausar la campaña ante pérdida de integridad, no ante un fallo cosmético.
- Exportar participantes y auditoría al cierre; verificar el hash del export.

## Contingencia

- Mantener QR y URL de respaldo hacia una página de estado.
- Poder pausar nuevos registros sin interrumpir partidas iniciadas.
- Conservar un export de participantes elegibles antes de ejecutar cualquier sorteo.
- Documentar toda descalificación con motivo y actor responsable.
