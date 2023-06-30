import {
    bigintToFormattedPercent,
    escapeSpecialCharacters,
    formatUnits,
    formatUnitsNumber,
    WithdrawRequestStatus,
} from "../../../../../common";
import { floatToMd, truncateDecimalsToStr } from "../../../../../common/text-formatter";
import { CollateralCurrency } from "../../../../../database/entities";
import { SUPPORTED_TOKENS } from "../../../constants";
import { RiskStrategyLevels } from "../../new-credit-request/new-credit-request.types";
import { WithdrawRequestDetails } from "../../../bot-manager.service";

export class WithdrawTextSource {
    static getExistedPendingRequestText(
        rawWithdrawAmount: bigint,
        collateralSymbol: string,
        collateralDecimals: number,
        walletToWithdraw: string,
        requestStatus: WithdrawRequestStatus
    ) {
        const withdrawAmount = truncateDecimalsToStr(
            formatUnits(rawWithdrawAmount, collateralDecimals),
            4
        );
        return escapeSpecialCharacters(
            "‼ *You already have pending 'Withdraw' request.*\n" +
                "\n" +
                "📧 Please wait for the money transfer\n\n" +
                "📝 *Request details:*\n" +
                `Status: *${requestStatus}*\n` +
                `Requested withdraw amount: *${withdrawAmount} ${collateralSymbol}*\n` +
                `Wallet to withdraw: \` ${walletToWithdraw} \` \n` +
                "\n" +
                "⚠️ The duration of money transfers may vary depending on the current network congestion."
        );
    }

    static getZeroBalanceText() {
        const zeroSupplyCaseText = "🚫 Your current deposit balance is *zero*. \n";
        return this.makeInsufficientBalanceTemplateText(zeroSupplyCaseText);
    }

    static getInsufficientBalanceText(utilizationFactor: bigint, collateralFactor: bigint) {
        const insufficientLiquidityCaseText =
            "🚫 You currently *can not make a withdrawal* as your current utilization factor exceeds the collateral factor applied to your credit line.\n" +
            `📊 Your utilization factor is *${bigintToFormattedPercent(
                utilizationFactor
            )} %* and the collateral factor is *${bigintToFormattedPercent(collateralFactor)} %*.\n` +
            "\n" +
            "📈 To adjust your utilization and make a withdrawal, you can either increase your collateral or reduce your outstanding balance.\n";

        return this.makeInsufficientBalanceTemplateText(insufficientLiquidityCaseText);
    }

    private static makeInsufficientBalanceTemplateText(caseText: string) {
        return escapeSpecialCharacters(
            "‼ *You don't have sufficient funds to withdraw at the moment.*\n" +
                "\n" +
                `${caseText}` +
                "\n" +
                "💰 To add funds to your account, please create a *'Deposit'* request."
        );
    }

    static getWithdrawInfoText(cryptoProcFee: bigint, collateralFactor: bigint) {
        const mdProcessingFee = bigintToFormattedPercent(cryptoProcFee);
        const mdCollateralFactor = bigintToFormattedPercent(collateralFactor);
        return escapeSpecialCharacters(
            "📜 *WITHDRAW TERMS*\n" +
                "\n" +
                "📝 The withdraw allows you to get the part of you collateral back.\n" +
                "\n" +
                "️️⚠️ Withdraw operation increases the utilization rate of your position and increases the risk of liquidation.\n" +
                "\n" +
                `️️⚠ The total debt for your position cannot exceed *${mdCollateralFactor} %* of the remaining deposit.\n` +
                "\n" +
                `⚠️ *${mdProcessingFee} %* of withdrawal amount will be apply as processing fee.\n` +
                "An amount equal to the fee *will be added to your debt position*"
        );
    }

    static getGeneralEnterAmountText(
        collateralCurrency: CollateralCurrency,
        rawDepositAmount: bigint,
        maxAmountToWithdraw: bigint,
        utilizationRate: bigint,
        collateralFactor: bigint
    ) {
        const mdDepositAmount = truncateDecimalsToStr(
            formatUnits(rawDepositAmount, collateralCurrency.decimals)
        );
        const mdUtilizationRate = bigintToFormattedPercent(utilizationRate);
        const mdMaxUtilizationRate = bigintToFormattedPercent(collateralFactor);
        const mdMaxAmountToWithdraw = truncateDecimalsToStr(
            formatUnits(maxAmountToWithdraw, collateralCurrency.decimals),
            4
        );

        return escapeSpecialCharacters(
            `💶 *Please enter ${collateralCurrency.symbol} amount you want to withdraw*\n` +
                "\n" +
                "📝 *Current credit line state:*\n" +
                `Deposit amount: *${mdDepositAmount} ${collateralCurrency.symbol}*\n` +
                `Utilization rate: *${mdUtilizationRate} %*\n` +
                `Max utilization rate: *${mdMaxUtilizationRate} %*\n` +
                "\n" +
                `🎯 *Max allowed amount to withdraw:*  *${mdMaxAmountToWithdraw} ${collateralCurrency.symbol}*\n` +
                "\n" +
                `💡 Input example: *1.245* ( Equivalent of 1.245 ${collateralCurrency.symbol} ) `
        );
    }

    static getFullWithdrawEnterAmountText(
        collateralCurrency: CollateralCurrency,
        rawDepositAmount: bigint,
        maxAmountToWithdraw: bigint,
        utilizationRate: bigint
    ) {
        const mdDepositAmount = truncateDecimalsToStr(
            formatUnits(rawDepositAmount, collateralCurrency.decimals)
        );
        const mdUtilizationRate = bigintToFormattedPercent(utilizationRate);

        return escapeSpecialCharacters(
            "📉 *Your current debt position is zero.*\n" +
                "\n" +
                "💰 In this case, you can only withdraw *the entire deposit amount*, partial withdrawal is not provided\n" +
                "\n" +
                "📝 *Current credit line state:*\n" +
                `Deposit amount: *${mdDepositAmount} ${collateralCurrency.symbol}*\n` +
                `Utilization rate: *${mdUtilizationRate} %*\n` +
                "\n" +
                `🎯 *Amount that can be withdrawn:*  *${mdDepositAmount} ${collateralCurrency.symbol}\n*` +
                "\n" +
                "💸 *No processing fee will be applied*, making the withdrawal operation completely free for you.\n" +
                "\n" +
                "🔄 To proceed, please select the *'Withdraw All'* option."
        );
    }

    static getEnterAddressToWithdrawText(collateralSymbol: string) {
        const network =
            collateralSymbol === SUPPORTED_TOKENS.ETH
                ? "*Ethereum mainnet* based"
                : "*Bitcoin mainnet* based";
        const addressExample =
            collateralSymbol === SUPPORTED_TOKENS.ETH
                ? "0xF9a46555cbd3bc5461BD09c2E77e24B630476Dc3"
                : "bc1pac6ywnd0al7uq7u3vuvpl94s25qkdna7024qy6w50jeuzeyxf2dslqzswk";
        return escapeSpecialCharacters(
            `📬 *Please enter your ${collateralSymbol} wallet address you want to get your collateral to* \n\n` +
                `‼ Make sure to provide ${network} address\n` +
                "\n" +
                `💡 Input example: *${addressExample}*`
        );
    }

    static getSignWithdrawApplicationText(
        withdrawRequestDetails: WithdrawRequestDetails,
        addressToWithdraw: string,
        withdrawAmount: bigint
    ) {
        const colSymbol = withdrawRequestDetails.currencies.collateralCurrency.symbol;
        const debtSymbol = withdrawRequestDetails.currencies.debtCurrency.symbol;

        const { cs, ns, mdProcessingFeeFiatAmount, mdProcessingFeeCryptoAmount, mdWithdrawAmount } =
            this.prepareSignApplicationData(withdrawRequestDetails, withdrawAmount);
        return escapeSpecialCharacters(
            "📜 *Withdraw request details*\n" +
                "\n" +
                `💱 You have requested *${mdWithdrawAmount} ${colSymbol}* to withdraw\n` +
                "\n" +
                "📉 *Current state:*\n" +
                `Deposit amount: ${cs.mdRawDepositAmount} ${colSymbol}\n` +
                `Debt amount: ${cs.mdDebtAmount} ${debtSymbol}\n` +
                `Utilization rate: ${cs.mdUtilizationPercent} %\n` +
                `Liquidation risk: ${cs.mdLiquidationRisk}\n` +
                "\n" +
                "📈 *New state:*\n" +
                `Deposit amount: ${ns.mdRawDepositAmount} ${colSymbol}\n` +
                `Debt amount: ${ns.mdDebtAmount} ${debtSymbol}\n` +
                `Utilization rate: ${ns.mdUtilizationPercent} %\n` +
                `Liquidation risk: ${ns.mdLiquidationRisk}\n` +
                "\n" +
                `💸 Processing fee: ${mdProcessingFeeCryptoAmount} ${colSymbol} ( ${mdProcessingFeeFiatAmount} ${debtSymbol} )\n` +
                "\n" +
                "✅ *After you agree to our offer, we will send requested collateral amount to your address:*\n" +
                `\` ${addressToWithdraw} \``
        );
    }

    static getApproveWithdrawRequestText(addressToWithdraw: string, collateralSymbol: string) {
        return escapeSpecialCharacters(
            "✅ *Done! You've created a new 'Withdraw' request!* \n\n" +
                `💸 We will send the requested *${collateralSymbol}* amount to the address:\n` +
                `\`${addressToWithdraw} \`\n` +
                "\n" +
                "⚠️ The duration of money transfers may vary depending on the current network congestion.\n" +
                "\n" +
                "🔰 You always can check all you request details. \n" +
                "To do this, go to *'View my requests'* tab from the *'Manage my portfolio'* menu.\n"
        );
    }

    static getRejectWithdrawRequestText() {
        return escapeSpecialCharacters(
            "❌ *Withdraw Request Rejected* ❌\n\n" +
                "We have received confirmation that you've rejected the request to withdrawal.\n" +
                "If you have any questions or need further assistance, please contact our customer support team.\n"
        );
    }

    private static prepareSignApplicationData(
        withdrawRequestDetails: WithdrawRequestDetails,
        withdrawAmount: bigint
    ) {
        const collateralCurrency = withdrawRequestDetails.currencies.collateralCurrency;
        const debtCurrency = withdrawRequestDetails.currencies.debtCurrency;
        const currentState = withdrawRequestDetails.currentState;
        const newState = withdrawRequestDetails.newState;
        return {
            cs: {
                mdRawDepositAmount: truncateDecimalsToStr(
                    formatUnits(currentState.rawDepositAmount, collateralCurrency.decimals),
                    4
                ),
                mdDebtAmount: truncateDecimalsToStr(
                    formatUnits(currentState.debtAmount, debtCurrency.decimals)
                ),
                mdUtilizationPercent: bigintToFormattedPercent(currentState.utilizationRate),
                mdLiquidationRisk: this.getCurrentLiquidationRisk(
                    currentState.utilizationRate,
                    withdrawRequestDetails.collateralFactor
                ),
            },
            ns: {
                mdRawDepositAmount: truncateDecimalsToStr(
                    formatUnits(newState.rawDepositAmount, collateralCurrency.decimals),
                    4
                ),
                mdDebtAmount: truncateDecimalsToStr(
                    formatUnits(newState.debtAmount, debtCurrency.decimals)
                ),
                mdUtilizationPercent: bigintToFormattedPercent(newState.utilizationRate),
                mdLiquidationRisk: this.getCurrentLiquidationRisk(
                    newState.utilizationRate,
                    withdrawRequestDetails.collateralFactor
                ),
            },
            mdProcessingFeeCryptoAmount: floatToMd(
                formatUnits(
                    withdrawRequestDetails.processingFeeCryptoAmount,
                    collateralCurrency.decimals
                )
            ),
            mdProcessingFeeFiatAmount: truncateDecimalsToStr(
                formatUnits(withdrawRequestDetails.processingFeeFiatAmount, debtCurrency.decimals)
            ),
            mdWithdrawAmount: formatUnits(withdrawAmount, collateralCurrency.decimals),
        };
    }

    static getIncorrectInputStructText(userInput: string, collateralCurrency: CollateralCurrency) {
        const caseText =
            "❗ *Amount should be a number that is greater than 0.*\n" +
            "\n" +
            `💡 Input example: *1.245* ( Equivalent of *1.245 ${collateralCurrency.symbol}* )\n`;

        return this.makeIncorrectInputTemplateText(caseText, userInput);
    }

    static getIncorrectInputDecimalsText(userInput: string, collateralCurrency: CollateralCurrency) {
        const caseText =
            `❗ *Input amount should not exceeds the currency accuracy*\n` +
            "\n" +
            `💡 Max allowed accuracy for *${collateralCurrency.symbol}*: *${collateralCurrency.decimals}* decimals\n`;

        return this.makeIncorrectInputTemplateText(caseText, userInput);
    }

    static getIncorrectInputMaxAmountText(
        userInput: string,
        collateralCurrency: CollateralCurrency,
        maxAllowedWithdrawAmount: bigint
    ) {
        const mdMaxAllowedWithdrawAmount = formatUnits(
            maxAllowedWithdrawAmount,
            collateralCurrency.decimals
        );

        const caseText =
            `❗ *Input amount can not be greater than max allowed withdraw amount*\n` +
            "\n" +
            `💡 Max allowed withdraw amount: *${mdMaxAllowedWithdrawAmount} ${collateralCurrency.symbol}*\n`;

        return this.makeIncorrectInputTemplateText(caseText, userInput);
    }

    private static makeIncorrectInputTemplateText(caseText: string, userInput: string) {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n" +
                "\n" +
                `${caseText}` +
                "\n" +
                `🚫 *Entered amount:* ${userInput}\n` +
                "\n" +
                "🔄 Please try again."
        );
    }

    static getFinalAllowedWithdrawAmountCheckText() {
        return escapeSpecialCharacters(
            "❌ *Withdrawal amount exceeds allowable limit* ❌\n" +
                "\n" +
                "📝 Since you entered the withdrawal amount, there have been changes to your credit line state.\n" +
                "Currently, the amount you entered *exceeds the maximum allowable withdrawal limit*.\n" +
                "\n" +
                "⚠️ This could be due to fluctuations in the collateral's price or the accumulation of interest on your debt position.\n" +
                "\n" +
                "🔄 Please return to the withdrawal amount screen and enter a new amount based on the updated state of your credit line."
        );
    }

    static getWithdrawalProcessingErrorText() {
        return escapeSpecialCharacters(
            "❌ *Withdrawal Request Unavailable* ❌\n" +
                "\n" +
                "📢 We apologize for the inconvenience, but we are currently experiencing technical difficulties in processing your withdrawal request.\n" +
                "\n" +
                "⚠️ Please be assured that our team is actively working to resolve this issue as quickly as possible.\n" +
                "\n" +
                "⏳ *We recommend that you create a new withdrawal request later, once the technical issue has been resolved.*\n" +
                "\n" +
                "💡 In the meantime, we kindly request your patience and understanding.\n" +
                "🔧 If you have any urgent concerns or questions, please feel free to reach out to our support team for assistance.\n"
        );
    }

    static getAddressValidationErrorText(userInput: string, collateralCurrency: CollateralCurrency) {
        switch (collateralCurrency.symbol) {
            case SUPPORTED_TOKENS.ETH:
                return escapeSpecialCharacters(
                    "❌ *Entered Ethereum address is incorrect.* ❌\n\n" +
                        "Ethereum address should be a valid hexadecimal address consisting of 40 characters.\n\n" +
                        "For example: *0xAbcDeF1234567890AbCdEf1234567890aBcDeF12*\n\n" +
                        `*Entered Ethereum address:* ${userInput}\n\n` +
                        "🔄 *Please try again*."
                );
            case SUPPORTED_TOKENS.BTC:
                return escapeSpecialCharacters(
                    "❌ *Entered Bitcoin address is incorrect.* ❌\n\n" +
                        "Bitcoin address should be a valid alphanumeric address consisting of 26-35 characters.\n\n" +
                        "For example: *1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa*\n\n" +
                        `*Entered Bitcoin address:* ${userInput}\n\n` +
                        "🔄 *Please try again*."
                );
            default:
                throw new Error("Unsupported collateral token received");
        }
    }

    // FIXME: Move to common after Borrow scene will be merged
    private static getCurrentLiquidationRisk(rawUtilRate: bigint, rawCollateralFactor: bigint) {
        const utilRate = formatUnitsNumber(rawUtilRate);
        const collateralFactor = formatUnitsNumber(rawCollateralFactor);

        if (utilRate <= RiskStrategyLevels.MEDIUM) {
            return "🟢 LOW";
        }
        if (utilRate <= collateralFactor) {
            return "🟠 MEDIUM";
        }
        return "🔴 HIGH";
    }
}
