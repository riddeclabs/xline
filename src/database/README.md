## Generating a migration

* Drop an existing schema
```
yarn typeorm schema:drop -d src/database/index.ts
```
* Run existing migrations
```
yarn typeorm migration:run -d src/database/index.ts
```
* Generate new migration
```
yarn typeorm migration:generate -d src/database/index.ts src/database/migrations/<name-of-new-migration>
```
* OR Create new migration (blank)
```
yarn typeorm migration:create src/database/migrations/<name-of-new-migration>
```
* Manually add new migration to the list in src/database/migrations/index.ts

## Seed database
* Drop an existing schema
```
yarn typeorm schema:drop -d src/database/index.ts
```

* Run seeding script

```
yarn database:seed
```