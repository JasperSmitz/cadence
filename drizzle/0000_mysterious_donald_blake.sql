CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`energy_centi_kcal_per_100g` integer NOT NULL,
	`protein_mg_per_100g` integer NOT NULL,
	`carbohydrate_mg_per_100g` integer NOT NULL,
	`fat_mg_per_100g` integer NOT NULL,
	`fiber_mg_per_100g` integer,
	`serving_size_mg` integer,
	`serving_label` text,
	`package_size_mg` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "foods_id_valid" CHECK(length("foods"."id") = 36),
	CONSTRAINT "foods_name_valid" CHECK(length(trim("foods"."name")) between 1 and 200 and "foods"."name" = trim("foods"."name")),
	CONSTRAINT "foods_energy_valid" CHECK(typeof("foods"."energy_centi_kcal_per_100g") = 'integer' and "foods"."energy_centi_kcal_per_100g" between 0 and 100000),
	CONSTRAINT "foods_protein_mg_per_100g_valid" CHECK("foods"."protein_mg_per_100g" is null or (typeof("foods"."protein_mg_per_100g") = 'integer' and "foods"."protein_mg_per_100g" between 0 and 100000)),
	CONSTRAINT "foods_carbohydrate_mg_per_100g_valid" CHECK("foods"."carbohydrate_mg_per_100g" is null or (typeof("foods"."carbohydrate_mg_per_100g") = 'integer' and "foods"."carbohydrate_mg_per_100g" between 0 and 100000)),
	CONSTRAINT "foods_fat_mg_per_100g_valid" CHECK("foods"."fat_mg_per_100g" is null or (typeof("foods"."fat_mg_per_100g") = 'integer' and "foods"."fat_mg_per_100g" between 0 and 100000)),
	CONSTRAINT "foods_fiber_mg_per_100g_valid" CHECK("foods"."fiber_mg_per_100g" is null or (typeof("foods"."fiber_mg_per_100g") = 'integer' and "foods"."fiber_mg_per_100g" between 0 and 100000)),
	CONSTRAINT "foods_serving_size_mg_valid" CHECK("foods"."serving_size_mg" is null or (typeof("foods"."serving_size_mg") = 'integer' and "foods"."serving_size_mg" between 1 and 1000000000)),
	CONSTRAINT "foods_package_size_mg_valid" CHECK("foods"."package_size_mg" is null or (typeof("foods"."package_size_mg") = 'integer' and "foods"."package_size_mg" between 1 and 1000000000)),
	CONSTRAINT "foods_serving_label_valid" CHECK("foods"."serving_label" is null or ("foods"."serving_size_mg" is not null and length(trim("foods"."serving_label")) between 1 and 100 and "foods"."serving_label" = trim("foods"."serving_label"))),
	CONSTRAINT "foods_notes_valid" CHECK("foods"."notes" is null or (length(trim("foods"."notes")) between 1 and 2000 and "foods"."notes" = trim("foods"."notes"))),
	CONSTRAINT "foods_timestamps_valid" CHECK(typeof("foods"."created_at") = 'integer' and typeof("foods"."updated_at") = 'integer' and "foods"."created_at" >= 0 and "foods"."updated_at" >= "foods"."created_at" and "foods"."updated_at" <= 9007199254740991)
);
--> statement-breakpoint
CREATE INDEX `foods_name_idx` ON `foods` (`name`);