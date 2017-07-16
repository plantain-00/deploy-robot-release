"use strict";
const defaultConfig = {
    applications: [],
    localeName: "zh-cn",
};
try {
    // tslint:disable-next-line:no-var-requires
    require("../deploy-robot.config.js")(defaultConfig);
}
catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error);
}
module.exports = defaultConfig;
