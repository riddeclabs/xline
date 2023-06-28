import { TestDatabaseSeeder } from "./database-seeder";
import { CollateralCurrency, DebtCurrency } from "../../database/entities";
import { parseUnits } from "../../common";
import { BatchRequestData, CurrencyBaseData } from "./types";

export class EntityBatchGenerator extends TestDatabaseSeeder {
    // Allows to create a batch of credit lines and related requests with transactions
    // Note: If request options are not provided, transaction for borrow and repay requests will not be generated.
    //       Also, only 1 request for each request type will be generated
    // Note: If `currencyPair` option is not provided, a credit lines with random currencies will be generated
    async createBatchOfCreditLines(
        linesAmount = 1,
        opts?: {
            requests?: {
                repayRequest: BatchRequestData;
                borrowRequest: BatchRequestData;
                depositRequest: BatchRequestData;
                withdrawRequest: BatchRequestData;
            };
            currencyPair?: { collateralCurrency?: CurrencyBaseData; debtCurrency?: CurrencyBaseData };
        }
    ) {
        const debtCurrency = opts?.currencyPair?.debtCurrency
            ? await this.findOrCreateDebtCurrency(opts.currencyPair.debtCurrency)
            : null;

        const collateralCurrency = opts?.currencyPair?.collateralCurrency
            ? await this.findOrCreateCollateralCurrency(opts.currencyPair.collateralCurrency)
            : null;

        const creditLines = [];
        for (let i = 0; i < linesAmount; i++) {
            const cl = await this.makeCreditLine({
                ...(collateralCurrency && {
                    collateralCurrency,
                }),
                ...(debtCurrency && {
                    debtCurrency,
                }),
                rawCollateralAmount: parseUnits("2.54321", collateralCurrency?.decimals),
                debtAmount: parseUnits("3000", debtCurrency?.decimals),
                feeAccumulatedFiatAmount: parseUnits("277.54321", debtCurrency?.decimals),
                healthyFactor: parseUnits("1.54321"),
            });
            creditLines.push(cl);
        }

        for (const creditLine of creditLines) {
            const bpr = await this.makeBusinessPaymentRequisite({
                debtCurrencyId: creditLine.debtCurrencyId,
            });

            for (let i = 0; i < (opts?.requests?.repayRequest.requestsCount ?? 1); i++) {
                const repayRequest = await this.makeRepayRequest({
                    creditLineId: creditLine.id,
                    businessPaymentRequisiteId: bpr.id,
                });

                // Note! By default, we don't generate TX for repay request
                if (opts?.requests?.repayRequest?.isTxExist ?? false) {
                    await this.makeFiatTransaction({
                        repayRequestId: repayRequest.id,
                    });
                }
            }

            for (let i = 0; i < (opts?.requests?.borrowRequest.requestsCount ?? 1); i++) {
                const borrowRequest = await this.makeBorrowRequest({
                    creditLineId: creditLine.id,
                });

                // Note! By default, we don't generate TX for borrow request
                if (opts?.requests?.borrowRequest.isTxExist ?? false) {
                    await this.makeFiatTransaction({
                        borrowRequestId: borrowRequest.id,
                        repayRequestId: null,
                        ibanFrom: bpr.iban,
                        ibanTo: creditLine.userPaymentRequisite.iban,
                        nameFrom: bpr.bankName,
                        nameTo: creditLine.user.name,
                    });
                }
            }

            for (let i = 0; i < (opts?.requests?.depositRequest.requestsCount ?? 1); i++) {
                const depositRequest = await this.makeDepositRequest({
                    creditLineId: creditLine.id,
                });

                if (opts?.requests?.depositRequest.isTxExist ?? true) {
                    await this.makeCryptoTransaction({
                        depositRequestId: depositRequest.id,
                    });
                }
            }

            for (let i = 0; i < (opts?.requests?.withdrawRequest.requestsCount ?? 1); i++) {
                const withdrawRequest = await this.makeWithdrawRequest({
                    creditLineId: creditLine.id,
                });

                if (opts?.requests?.withdrawRequest.isTxExist ?? true) {
                    await this.makeCryptoTransaction({
                        withdrawRequestId: withdrawRequest.id,
                    });
                }
            }
        }
    }

    private async findOrCreateDebtCurrency(debtCurrency: CurrencyBaseData) {
        let dc = await this.dataSource.getRepository(DebtCurrency).findOneBy({
            symbol: debtCurrency.symbol,
        });

        if (!dc) {
            dc = await this.makeDebtCurrency({
                symbol: debtCurrency.symbol,
                decimals: debtCurrency.decimals,
            });
        }

        return dc;
    }

    private async findOrCreateCollateralCurrency(collateralCurrency: CurrencyBaseData) {
        let cc = await this.dataSource.getRepository(CollateralCurrency).findOneBy({
            symbol: collateralCurrency.symbol,
        });

        if (!cc) {
            cc = await this.makeCollateralCurrency({
                symbol: collateralCurrency.symbol,
                decimals: collateralCurrency.decimals,
            });
        }

        return cc;
    }
}
