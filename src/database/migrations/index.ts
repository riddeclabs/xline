import { MixedList } from "typeorm";
import { Init1683554126057 } from "./1683554126057-Init";
import { CurrenciesUnique1684830957456 } from "./1684830957456-CurrenciesUnique";
import { UpdateBorrowRequest1685114118841 } from "./1685114118841-UpdateBorrowRequest";
import { AddForeignKeysToEntity1686652486758 } from "./1686652486758-AddForeignKeysToEntity";
import { BorrowRequestStatus1686833303368 } from "./1686833303368-BorrowRequestStatus";

// eslint-disable-next-line @typescript-eslint/ban-types
const migrations: MixedList<string | Function> = [
    Init1683554126057,
    CurrenciesUnique1684830957456,
    UpdateBorrowRequest1685114118841,
    AddForeignKeysToEntity1686652486758,
    BorrowRequestStatus1686833303368,
];

export default migrations;
