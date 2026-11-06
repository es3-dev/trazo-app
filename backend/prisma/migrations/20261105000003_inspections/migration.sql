CREATE TYPE "TipoInspeccion" AS ENUM ('CALIDAD','SEGURIDAD','AMBIENTAL');
CREATE TYPE "ResultadoInspeccion" AS ENUM ('CONFORME','OBSERVACIONES','NO_CONFORME');
CREATE TYPE "EstadoInspeccion" AS ENUM ('ABIERTA','EN_SEGUIMIENTO','CERRADA');
CREATE TABLE "TBL_INSPECCIONES" (
  "id" SERIAL PRIMARY KEY,
  "id_obras" INTEGER NOT NULL REFERENCES "TBL_OBRAS"("id_obras") ON DELETE CASCADE,
  "fecha" DATE NOT NULL,
  "tipo" "TipoInspeccion" NOT NULL,
  "zona" VARCHAR(150),
  "responsable" VARCHAR(150) NOT NULL,
  "resultado" "ResultadoInspeccion" NOT NULL,
  "hallazgos" TEXT,
  "acciones" TEXT,
  "plazo" DATE,
  "estado" "EstadoInspeccion" NOT NULL DEFAULT 'ABIERTA',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "inspecciones_obra_estado_idx" ON "TBL_INSPECCIONES"("id_obras", "estado");
