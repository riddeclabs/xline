import { EconomicalParameters } from "../../../../database/entities";
import { OpenCreditLineData } from "../../../risk-engine/risk-engine.types";
import { formatUnits, formatUnitsNumber } from "../../../../common/fixed-number";
import { truncateDecimalsToStr, floatToMd } from "../../../../common/text-formatter";
import { EXP_SCALE } from "../../../../common/constants";
import {
    NewCreditRequestContext,
    RiskStrategyLevels,
    SignApplicationSceneData,
} from "./new-credit-request.types";
import { SignApplicationOptions } from "../../constants";
import { escapeSpecialCharacters } from "../../../../common";

export class NewCreditRequestText {
    static getSignGeneralTermsMsg() {
        return (
            "📜 *GENERAL TERMS*\n\n\n" +
            "💲 You will get the USD equivalent of provided collateral amount`.` \n\n" +
            "💱 The exact fiat amount will be calculated based on the price of the collateral token *at the time the funds are received*`.` \n\n" +
            "🔒 You will also need to chose a risk strategy`.`\n" +
            "Depending on it`,` the amount of fiat to be received will be calculated`.` \n\n" +
            "✅ After the opening of the line is approved`,` we will send you the required amount in *USD*`.` \n\n" +
            "💼 Then you will be able to independently change your credit line `(`make a deposit`,` withdraw part of the collateral`,` take additional credit funds`,` etc`)``.`"
        );
    }

    static getChooseCollateralMsg() {
        return "💰 *Chose the token you want to use as collateral*";
    }

    static getEnterIbanMsg() {
        return (
            "💳 *Please enter your IBAN*\n\n" +
            "‼ Please make sure to provide a *USD* bank account IBAN\n\n" +
            "‼ Transactions may fail if a *non`-`USD* bank account is provided\n\n" +
            "💡 Input example: *EU BW 1457 8412 4857 5478* `(`spaces are optional and can be omitted`)`"
        );
    }

    static getEnterBankAccountNameMsg() {
        return (
            "💳 *Please enter your bank account name*\n\n" +
            "⚠️ We collect user bank account name `(`first name and surname`)` for secure and accurate bank transfers`,` ensuring compliance with privacy laws`.`\n\n" +
            "💡 Input example: *JOHN DOE*"
        );
    }

    static getEnterCryptoAmountMsg(ctx: NewCreditRequestContext) {
        return (
            `💶 *Please enter ${ctx.scene.session.state.collateralCurrency?.symbol} amount you want to provide*\n\n` +
            "️⚠ This amount will be used to show you the calculation principle`.`\n" +
            "Actual credit amounts will be calculated based on the *actual received* collateral amount`.` \n\n" +
            "💡 Input example: *1`.`245* `(` Equivalent of 1`.`245 " +
            `${ctx.scene.session.state.collateralCurrency?.symbol}` +
            " `)`"
        );
    }

    static getChoseRiskStrategyMsg(collateralFactor: number) {
        return (
            "🚦 *Chose the risk strategy*\n\n" +
            "🟢 LOW `-` " +
            `${RiskStrategyLevels.LOW * 100}% utilization` +
            "\n\n" +
            "🟠 MEDIUM `-` " +
            `${RiskStrategyLevels.MEDIUM * 100}% utilization` +
            "\n\n" +
            "🔴 HIGH `-` Current collateral factor rate `(`" +
            `${collateralFactor * 100}%` +
            "`)` will be applied \n"
        );
    }

    static getSignApplicationButtonMsg() {
        return "❗️ *After you agree to our offer`,` we will generate a unique wallet to send the funds to*";
    }

    static getSignApplicationDetailMsg(
        economicalParameters: EconomicalParameters,
        loanData: OpenCreditLineData,
        sceneData: SignApplicationSceneData
    ) {
        const dtd = this.prepareDetailsTextData(economicalParameters, loanData, sceneData);

        return (
            `🔸 *The amounts you see have been calculated based on an estimated deposit of ${dtd.mdSupplyAmountRaw} ${sceneData.colToken.symbol}* \n` +
            "\n" +
            `Supply Amount: ${dtd.mdSupplyAmountUsd} ${sceneData.debtToken.symbol} \n` +
            `Collateral Amount: ${dtd.mdCollateralAmountUsd} ${sceneData.debtToken.symbol} \n` +
            `Debt Amount: ${dtd.mdDebtAmountUsd} ${sceneData.debtToken.symbol} \n` +
            "\n" +
            `Risk level: ${dtd.riskLevel} \n` +
            `Utilization rate: ${dtd.mdUtilPercent} % \n` +
            `\n` +
            `Processing fees:\n` +
            `Deposit: ${dtd.mdSupplyProcFeePercent} % / ${dtd.mdSupplyProcFeeUsd} ${sceneData.debtToken.symbol} \n` +
            `Borrow: ${dtd.mdBorrowProcFeePercent} % / ${dtd.mdBorrowProcFeeUsd} ${sceneData.debtToken.symbol} \n` +
            `Total fee: ${dtd.mdTotalProcFeeUsd} ${sceneData.debtToken.symbol} \n` +
            "\n" +
            `Fiat Amount to Receive: ${dtd.mdFiatToReceive} ${sceneData.debtToken.symbol} \n` +
            `Actual debt amount: ${dtd.mdActualDebtAmountUsd} ${sceneData.debtToken.symbol}` +
            "\n\n" +
            `Current ${sceneData.colToken.symbol} Price: ${dtd.mdCurrentPrice} ${sceneData.debtToken.symbol} \n` +
            `You will be liquidated when ${sceneData.colToken.symbol} price drops below ${dtd.mdLimitPrice} ${sceneData.debtToken.symbol} \`(\` 🔻 \`-\` ${dtd.mdDropPricePercent} %\`)\` \n\n\n`
        );
    }

    static getSignApplicationMainMsg(
        economicalParameters: EconomicalParameters,
        sceneData: SignApplicationSceneData
    ) {
        const mtd = this.prepareMainTextData(economicalParameters, sceneData);

        return escapeSpecialCharacters(
            "📊 *Loan request details*\n\n\n" +
                `📈 *Your rates:*\n` +
                `APR: ${mtd.mdAprPercent} %\n` +
                `LiqFee: ${mtd.mdLiqFeePercent} %\n` +
                "\n" +
                `Selected risk strategy: ${mtd.mdSelectedRiskStrategyPercent} %\n` +
                `Max utilization: ${mtd.mdMaxUtilization} % from your deposit\n` +
                "\n" +
                `Processing fees:\n` +
                `Deposit: ${mtd.mdSupplyProcFeePercent} %\n` +
                `Borrow : ${mtd.mdBorrowProcFeePercent} % \n` +
                "\n" +
                `Collateral token: ${sceneData.colToken.symbol}\n` +
                "\n" +
                "🏦 *Bank account info*:\n" +
                `IBAN: ${sceneData.userIban}\n` +
                `Account name: ${sceneData.userName}\n` +
                "\n\n" +
                `🔸 You can send any collateral amount you want, the size of the credit will be calculated based on chosen risk strategy ( ${mtd.mdSelectedRiskStrategyPercent} % utilization ) ` +
                "and the actual oracle prices at the time of receipt of collateral\n"
        );
    }

    static getSignApplicationHandlerMsg(option: SignApplicationOptions, wallet?: string) {
        switch (option) {
            case SignApplicationOptions.APPROVE:
                return {
                    msg:
                        "✅ *Done`!` You've created new credit request`!`* \n\n" +
                        `📧 Please send your collateral to the address below\n\n` +
                        ` \` ${wallet} \`  `,
                    msg1: `https://api.qrserver.com/v1/create-qr-code/?data=${wallet}&size=500x500&ecc=L&margin=10`,
                    msg2:
                        "🔰 You always can check all you request details`.` \n" +
                        "To do this`,` go to *'View my requests'* tab from the *'Manage my portfolio'* menu.`",
                };
            case SignApplicationOptions.DISAPPROVE:
                return escapeSpecialCharacters(
                    "❌ *Credit Request Rejected* ❌\n\n" +
                        "We have received confirmation that you've rejected the request to open a new credit line.\n" +
                        "If you have any questions or need further assistance, please contact our customer support team.\n" +
                        "They can provide guidance on alternative financial options that may better suit your needs."
                );
            default:
                throw new Error("Incorrect sign application option");
        }
    }

    static getIbanValidationErrorMsg(userInput: string): string {
        return escapeSpecialCharacters(
            "❌ *Entered IBAN is incorrect.* ❌\n\n" +
                "IBAN should consist of 2 letter country code; 2 digit check number and " +
                "up to 30 alphanumeric characters of Basic Bank Account Number (BBAN) that are country-specific.\n\n" +
                "For example: *AD14 0008 0001 0012 3456 7890*\n\n" +
                `*Entered IBAN:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getNameValidationErrorMsg(userInput: string): string {
        return escapeSpecialCharacters(
            "❌ *Entered name is incorrect.* ❌\n\n" +
                "Name should consist of latin letters and contain 2 or more parts, separated with whitespace.\n\n" +
                "For example: *JOHN DOE* or *MAXIMILIAN JOHANNES MARIA HUBERT REICHSGRAF VON SPEE*.\n\n" +
                `*Entered name*: ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getAmountValidationErrorMsg(userInput: string): string {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                "Amount should be a number greater than 0.\n\n" +
                "For example: *1000* or *1000.00*.\n\n" +
                `*Entered amount:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getExistingCreditLineErrorMsg(collateral: string): string {
        return escapeSpecialCharacters(
            `❌ *You already have a credit line with ${collateral} collateral.* ❌\n\n` +
                "You can have only one active credit line for each collateral currency.\n\n" +
                "Please choose another currency to use as collateral."
        );
    }

    static prepareDetailsTextData(
        ep: EconomicalParameters,
        loanData: OpenCreditLineData,
        sceneData: SignApplicationSceneData
    ) {
        const riskLevel =
            sceneData.riskStrategy === formatUnits(ep.collateralFactor)
                ? "HIGH"
                : Object.keys(RiskStrategyLevels).find(
                      (key: string) => RiskStrategyLevels[<any>key] == sceneData.riskStrategy
                  );
        // FIXME: mb just EXP_SCALE - RS ?
        const mdDropPricePercent = truncateDecimalsToStr(
            formatUnits(
                (EXP_SCALE - (loanData.collateralLimitPrice * EXP_SCALE) / loanData.currentPrice) * 100n
            )
        );

        return {
            riskLevel,
            mdSupplyAmountRaw: truncateDecimalsToStr(sceneData.supplyAmount),
            mdSupplyAmountUsd: truncateDecimalsToStr(formatUnits(loanData.expSupplyAmountUsd)),
            mdCollateralAmountUsd: truncateDecimalsToStr(formatUnits(loanData.expCollateralAmountUsd)),
            mdDebtAmountUsd: truncateDecimalsToStr(formatUnits(loanData.expBorrowAmountUsd)),
            mdUtilPercent: floatToMd(Number(sceneData.riskStrategy) * 100),
            mdSupplyProcFeePercent: floatToMd(formatUnitsNumber(ep.fiatProcessingFee) * 100),
            mdSupplyProcFeeUsd: truncateDecimalsToStr(formatUnits(loanData.supplyProcFeeUsd)),
            mdBorrowProcFeePercent: floatToMd(formatUnitsNumber(ep.cryptoProcessingFee) * 100),
            mdBorrowProcFeeUsd: truncateDecimalsToStr(formatUnits(loanData.borrowProcFeeUsd)),
            mdTotalProcFeeUsd: truncateDecimalsToStr(formatUnits(loanData.totalProcFeeUsd)),
            mdFiatToReceive: truncateDecimalsToStr(
                formatUnits(loanData.expBorrowAmountUsd - loanData.totalProcFeeUsd)
            ),
            mdActualDebtAmountUsd: truncateDecimalsToStr(formatUnits(loanData.expBorrowAmountUsd)),
            mdCurrentPrice: truncateDecimalsToStr(formatUnits(loanData.currentPrice)),
            mdLimitPrice: truncateDecimalsToStr(formatUnits(loanData.collateralLimitPrice)),
            mdDropPricePercent,
        };
    }

    static prepareMainTextData(ep: EconomicalParameters, sceneData: SignApplicationSceneData) {
        return {
            mdAprPercent: truncateDecimalsToStr(formatUnitsNumber(ep.apr) * 100),
            mdLiqFeePercent: truncateDecimalsToStr(formatUnitsNumber(ep.liquidationFee) * 100),
            mdSelectedRiskStrategyPercent: Number(sceneData.riskStrategy) * 100,
            mdMaxUtilization: formatUnitsNumber(ep.collateralFactor) * 100,
            mdSupplyProcFeePercent: truncateDecimalsToStr(formatUnitsNumber(ep.fiatProcessingFee) * 100),
            mdBorrowProcFeePercent: truncateDecimalsToStr(
                formatUnitsNumber(ep.cryptoProcessingFee) * 100
            ),
        };
    }
}
