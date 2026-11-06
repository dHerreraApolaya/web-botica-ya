# Contrato de observabilidad técnica

- Los módulos utilizan un puerto independiente del cliente y códigos constantes registrados.
- La composición predeterminada no envía ni almacena eventos.
- Solo se aceptan módulo, código y severidad de una lista cerrada; contexto adicional se elimina.
- Consentimiento denegado, DNT o GPC descartan eventos sin cola posterior.
- Fallos del cliente nunca interrumpen la compra ni el acceso.
- No se envían búsquedas, datos de salud, identidad, errores crudos ni URLs.
- El tag directo de Better Stack se bloquea: su recepción incluyó IP e identificadores.
- No se integra Clarity hasta validar exclusiones de contenido sensible y consentimiento separado.
- La exportación anonimizada requiere backend y validación de agregación y transporte.
- No hay despliegues ni cambios en Vercel.
