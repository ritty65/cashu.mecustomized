export const parseSecret = (secret) => {
    try {
        if (secret instanceof Uint8Array) {
            secret = new TextDecoder().decode(secret);
        }
        return JSON.parse(secret);
    }
    catch (e) {
        throw new Error("can't parse secret");
    }
};
//# sourceMappingURL=NUT11.js.map