class LibTime {

    get(foo) {
        if (!foo)
            foo = new Date();

        return foo.getTime();
    }

    getUnixtime(foo) {
        if (!foo)
            foo = new Date();

        var unixtime_ms = foo.getTime();
        return ~~(unixtime_ms / 1e3);
    }
}

module.exports = LibTime;