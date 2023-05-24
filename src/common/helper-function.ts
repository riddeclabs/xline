export function generateReferenceNumber(): string {
    // Desired length of the reference number
    const length = 8;
    // Available characters for the reference number
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let reference = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        reference += characters.charAt(randomIndex);
    }

    return reference;
}
