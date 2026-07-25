CREATE TABLE `finanzas` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipo` ENUM('ingreso', 'gasto') NOT NULL,
  `monto` DECIMAL(12, 2) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `idx_finanzas_tipo`(`tipo`),
  INDEX `idx_finanzas_creado_en`(`creado_en`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
