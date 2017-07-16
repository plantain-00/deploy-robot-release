"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const github = require("./github");
const gitlab = require("./gitlab");
const config_1 = require("./config");
const locale_1 = require("./locale");
const locale = locale_1.getLocale(config_1.localeName);
/**
 * the mode handlers, there are `github` and `gitlab` handlers inside.
 * you can push other handers in it
 */
exports.handlers = { github, gitlab };
let handler;
exports.ports = {};
let onPortsUpdated = () => Promise.resolve();
/**
 * commands are designed be excuted one by one in a process globally.
 */
let isExecuting = false;
exports.commands = [];
let onCommandsUpdated = () => Promise.resolve();
exports.failedCommands = [];
async function runCommands() {
    if (!isExecuting) {
        isExecuting = true;
        while (exports.commands.length > 0) {
            const firstCommand = exports.commands.shift();
            try {
                await libs.exec(firstCommand.command);
                await handler.createComment(firstCommand.context.doneText, firstCommand.context);
                await onCommandsUpdated();
            }
            catch (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
                exports.failedCommands.push({ command: firstCommand, error });
                await handler.createComment(error, firstCommand.context);
            }
        }
        isExecuting = false;
    }
}
function start(app, path, mode, options) {
    handler = exports.handlers[mode];
    if (!handler) {
        // tslint:disable-next-line:no-console
        console.log(`mode "${mode}" is not found in "handlers".`);
        process.exit(1);
    }
    if (options) {
        if (options.initialCommands) {
            exports.commands = options.initialCommands;
        }
        if (options.initialPorts) {
            exports.ports = options.initialPorts;
        }
        if (options.onCommandsUpdated) {
            onCommandsUpdated = options.onCommandsUpdated;
        }
        if (options.onPortsUpdated) {
            onPortsUpdated = options.onPortsUpdated;
        }
    }
    app.get(path, (request, response) => {
        response.send(`<pre>${JSON.stringify({ commands: exports.commands, ports: exports.ports }, null, "  ")}</pre>`);
    });
    app.post(path, async (request, response) => {
        try {
            const repositoryName = handler.getRepositoryName(request);
            const application = config_1.applications.find((value, index, obj) => value.repositoryName === repositoryName);
            if (!application) {
                response.end("name of repository is not found");
                return;
            }
            if (!exports.ports[repositoryName]) {
                exports.ports[repositoryName] = {};
                await onPortsUpdated();
            }
            const signatureIsValid = handler.verifySignature(request, application);
            if (!signatureIsValid) {
                response.end("signatures don't match");
                return;
            }
            const eventName = handler.getEventName(request);
            if (eventName === handler.commentEventName) {
                const author = handler.getCommentAuthor(request);
                const comment = handler.getComment(request);
                for (const commentAction of application.commentActions) {
                    if (commentAction.filter(comment, author)) {
                        response.end("command accepted");
                        const context = handler.getCommentCreationContext(request, application);
                        exports.commands.push({ command: commentAction.command, context });
                        await onCommandsUpdated();
                        context.doneText = commentAction.doneMessage;
                        await handler.createComment(commentAction.gotMessage, context);
                        await runCommands();
                        return;
                    }
                }
                response.end("not a command");
            }
            else if (eventName === handler.pullRequestEventName) {
                response.end("command accepted");
                const action = handler.getPullRequestAction(request);
                const pullRequestId = handler.getPullRequestId(request);
                const context = handler.getPullRequestCommentCreationContext(request, application);
                if (action === handler.pullRequestOpenActionName) {
                    const availablePort = await libs.getPort();
                    exports.ports[repositoryName][pullRequestId] = availablePort;
                    await onPortsUpdated();
                    const branchName = handler.getBranchName(request);
                    const cloneUrl = handler.getHeadRepositoryCloneUrl(request);
                    await handler.createComment(locale.pullRequestOpenedGot, context);
                    context.doneText = locale.pullRequestOpenedDone.replace("{0}", application.pullRequest.getTestUrl(availablePort, pullRequestId));
                    exports.commands.push({ command: `${application.pullRequest.openedCommand} ${availablePort} ${branchName} ${pullRequestId} ${cloneUrl}`, context });
                }
                else if (action === handler.pullRequestUpdateActionName) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    await handler.createComment(locale.pullRequestUpdatedGot, context);
                    context.doneText = locale.pullRequestUpdatedDone;
                    exports.commands.push({ command: `${application.pullRequest.updatedCommand} ${port} ${pullRequestId}`, context });
                }
                else if (handler.isPullRequestMerged) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    delete exports.ports[repositoryName][pullRequestId];
                    await onPortsUpdated();
                    await handler.createComment(locale.pullRequestMergedGot, context);
                    context.doneText = locale.pullRequestMergedDone;
                    exports.commands.push({ command: `${application.pullRequest.mergedCommand} ${port} ${pullRequestId}`, context });
                }
                else if (handler.isPullRequestClosed) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    delete exports.ports[repositoryName][pullRequestId];
                    await onPortsUpdated();
                    await handler.createComment(locale.pullRequestClosedGot, context);
                    context.doneText = locale.pullRequestClosedDone;
                    exports.commands.push({ command: `${application.pullRequest.closedCommand} ${port} ${pullRequestId}`, context });
                }
                else {
                    response.end(`can not handle action: ${action}.`);
                    return;
                }
                await onCommandsUpdated();
                await runCommands();
            }
            else {
                response.end(`can not handle event: ${eventName}.`);
            }
        }
        catch (error) {
            // tslint:disable-next-line:no-console
            console.log(error);
            response.end(error.toString());
        }
    });
}
exports.start = start;
