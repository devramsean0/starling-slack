import { sqliteTable, int, text} from "drizzle-orm/sqlite-core";

export const transactionTable = sqliteTable("transactions", {
    id: int().primaryKey(),
    starling_id: text().notNull(),
})