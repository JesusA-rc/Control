ALTER TABLE `finanzas`
  ADD COLUMN `categoria` VARCHAR(80) NULL,
  ADD COLUMN `producto` VARCHAR(120) NULL,
  ADD COLUMN `ingredientes` TEXT NULL;

CREATE INDEX `idx_finanzas_categoria` ON `finanzas`(`categoria`);
CREATE INDEX `idx_finanzas_producto` ON `finanzas`(`producto`);
