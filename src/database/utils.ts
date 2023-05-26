export const uint256 = () => ({
    precision: 78,
    transformer: {
        to: (value: bigint) => value.toString(),
        from: (value: string) => (value ? BigInt(value) : 0n),
    },
});
export const uint256OrNull = () => ({
    precision: 78,
    transformer: {
        to: (value: bigint | null) => (value ? value.toString() : null),
        from: (value: string | null) => (value ? BigInt(value) : null),
    },
});
