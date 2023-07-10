import { escapeSpecialCharacters } from "../../../../../common";

export class DepositTextSource {
    static getVerifyPendingRequestText(wallet: string) {
        return (
            escapeSpecialCharacters(
                "‼ You already have pending *'Deposit'* request.\n" +
                    "\n" +
                    "📧 You can just use the provided address below to deposit\n\n"
            ) + `\` ${wallet} \``
        );
    }
    static getDepositInfoText(collateralSymbol: string) {
        return escapeSpecialCharacters(
            "📜 *DEPOSIT TERMS*\n\n" +
                "💼 The deposit allows you to increase your credit limit and *reduces the risk of liquidation* by reducing the utilization factor of your credit position.\n" +
                "\n" +
                `💲 To make a deposit, you will have to send ${collateralSymbol} to the provided address.\n` +
                "\n" +
                `✅ After confirmation, we will provide you with the address to deposit to and a new *'Deposit request'* will be created.`
        );
    }

    static getApproveDepositText(wallet: string) {
        return {
            mainMsg:
                escapeSpecialCharacters(
                    "✅ *Done! You've created new 'Deposit' request!* \n\n" +
                        `📧 Please send your collateral to the address below\n\n`
                ) + `\` ${wallet} \``,
            qrCodeLink: `https://api.qrserver.com/v1/create-qr-code/?data=${wallet}&size=500x500&ecc=L&margin=10`,
            detailsMsg: escapeSpecialCharacters(
                "You always can check all you request details. \n" +
                    "To do this, go to *'View my requests'* tab from the *'Manage my portfolio'* menu."
            ),
        };
    }

    static getRejectDepositText() {
        return escapeSpecialCharacters(
            "❌ *Deposit Request Rejected* ❌\n\n" +
                "We have received confirmation that you've rejected the request to deposit.\n" +
                "If you have any questions or need further assistance, please contact our customer support team.\n"
        );
    }
}
