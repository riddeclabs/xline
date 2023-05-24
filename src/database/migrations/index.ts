import { MixedList } from "typeorm";
import { Init1683554126057 } from "./1683554126057-Init";
import { CurrenciesUnique1684830957456 } from "./1684830957456-CurrenciesUnique";

// eslint-disable-next-line @typescript-eslint/ban-types
const migrations: MixedList<string | Function> = [Init1683554126057, CurrenciesUnique1684830957456];

export default migrations;
