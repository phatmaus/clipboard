module.exports = function () {
    return {
        height: 420,
        width: 600,
        globalHotKeyCombo: "CommandOrControl+C+Shift",
        doubleTapInterval: 222,
        firebase: {
            key: "definition",
            maxLength: 140,
            emptyDef: {
                definitions: [],
                lastUpdated: 0
            }
        },
        ui: {
            displayLimit: 10
        },
        errors:{
            errorDailogTitle: "error",
            connectionErrorMessage: "Can't connect to jargon store, check your network connection"
        }
    }
}