# ReporteEnerg — metodología / methodology

## Español

ReporteEnerg es un caso analítico construido con **datos simulados** para demostrar modelado,
Power Query, medidas DAX y comunicación ejecutiva sin exponer información de una empresa real.

- Grano operativo: lecturas SCADA y eventos energéticos por activo y fecha.
- Grano comercial: clientes y consumo agregado para análisis de demanda.
- Entregables: un archivo PBIX con siete páginas y un libro Excel complementario con doce hojas.
- Calidad: los identificadores son únicos, no existen vínculos externos y no se detectaron
  errores de fórmula en el libro.
- Excepción conocida: el registro incompleto `TX-046 / F-09` se conserva como evidencia de
  control de calidad y se excluye de los indicadores que requieren datos completos.

Los resultados describen el conjunto sintético incluido; no representan el desempeño de una
empresa real ni deben utilizarse para decisiones operativas.

## English

ReporteEnerg is an analytics case built with **simulated data** to demonstrate data modeling,
Power Query, DAX measures, and executive communication without exposing a real organization.

- Operational grain: SCADA readings and energy events by asset and date.
- Commercial grain: customers and aggregated consumption for demand analysis.
- Deliverables: a seven-page PBIX file and a complementary twelve-sheet Excel workbook.
- Quality: identifiers are unique, the workbook has no external links, and no formula errors
  were detected.
- Known exception: the incomplete `TX-046 / F-09` record is retained as data-quality evidence
  and excluded from indicators that require complete data.

The results describe only the included synthetic dataset; they do not represent a real company
and must not be used for operational decisions.
