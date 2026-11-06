# Contrato de observabilidad técnica

Aplicar la [política canónica](../../../docs/OBSERVABILITY.md); este contrato referencia sus
reglas y no las redefine.

## Evidencia ejecutable

- Filtrado, catálogo y permisos: `src/shared/observability/observability.service.test.ts`.
- Bloqueo del tag directo: `src/features/monitoring/rumPilot.util.test.ts`.
- Escenarios del piloto: [rum-evaluation.feature](./rum-evaluation.feature).

Los puertos de traces/funnel/UX y la exportación anonimizada del backend son trabajo pendiente,
no criterios satisfechos por los tests actuales.
