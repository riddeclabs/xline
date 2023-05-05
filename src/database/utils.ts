export const uint256 = () => ({
    precision: 78,
    transformer: {
        to: (value: bigint) => value.toString(),
        from: (value: string) => (value ? BigInt(value) : 0n),
    },
});
