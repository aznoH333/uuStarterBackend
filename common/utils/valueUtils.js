function valueOrUndefined(value) {
    if (value === null) {
        return undefined;
    }

    return value;
}

module.exports = {valueOrUndefined}