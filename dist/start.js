"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const robot = require("./robot");
const argv = libs.minimist(process.argv.slice(2), { "--": true });
const mode = argv.mode || argv.m || "github";
const port = argv.port || argv.p || 9996;
const host = argv.host || argv.h || "localhost";
const app = libs.express();
app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));
const dataFilePath = "ports.data";
function onPortsUpdated() {
    return libs.writeAsync(dataFilePath, JSON.stringify(robot.ports));
}
libs.readAsync(dataFilePath).then(data => {
    const ports = JSON.parse(data);
    robot.start(app, "/", mode, { onPortsUpdated, initialPorts: ports });
}).catch(error => {
    // tslint:disable-next-line:no-console
    console.log(error);
    robot.start(app, "/", mode, { onPortsUpdated });
});
app.listen(port, host, () => {
    // tslint:disable-next-line:no-console
    console.log(`deploy robot is running at: ${host}:${port} in mode: ${mode}`);
});
