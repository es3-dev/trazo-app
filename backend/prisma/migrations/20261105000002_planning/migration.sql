CREATE TYPE "EstadoPlan" AS ENUM ('PENDIENTE','EN_CURSO','BLOQUEADA','COMPLETADA');
CREATE TABLE "TBL_PLAN_ACTIVIDADES" (
  "id" SERIAL PRIMARY KEY,
  "id_obras" INTEGER NOT NULL REFERENCES "TBL_OBRAS"("id_obras") ON DELETE CASCADE,
  "nombre" VARCHAR(200) NOT NULL,
  "zona" VARCHAR(100),
  "responsable" VARCHAR(150),
  "inicio" DATE NOT NULL,
  "fin" DATE NOT NULL,
  "avance" INTEGER NOT NULL DEFAULT 0 CHECK ("avance" >= 0 AND "avance" <= 100),
  "estado" "EstadoPlan" NOT NULL DEFAULT 'PENDIENTE',
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("id_obras", "nombre")
);
CREATE INDEX "plan_obra_estado_idx" ON "TBL_PLAN_ACTIVIDADES"("id_obras", "estado");
