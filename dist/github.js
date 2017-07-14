"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const accessToken = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;
function getSignature(body, secret) {
    return "sha1=" + libs.crypto.createHmac("sha1", secret).update(body).digest("hex");
}
function createComment(content, context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`;
    return new Promise((resolve, reject) => {
        libs.request({
            url,
            method: "post",
            json: true,
            body: {
                body: `@${context.author}, ${content}`,
            },
            headers: {
                "Authorization": `token ${accessToken}`,
                "User-Agent": "SubsNoti-robot",
            },
        }, (error, incomingMessage, body) => {
            if (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            }
            else if (incomingMessage.statusCode !== 201) {
                // tslint:disable-next-line:no-console
                console.log(body);
            }
            resolve();
        });
    });
}
exports.createComment = createComment;
function getRepositoryName(request) {
    return request.body.repository.name;
}
exports.getRepositoryName = getRepositoryName;
function verifySignature(request, application) {
    const remoteSignature = request.header("X-Hub-Signature");
    const signature = getSignature(JSON.stringify(request.body), application.hookSecret);
    return signature === remoteSignature;
}
exports.verifySignature = verifySignature;
function getEventName(request) {
    return request.header("X-GitHub-Event");
}
exports.getEventName = getEventName;
exports.commentEventName = "issue_comment";
exports.pullRequestEventName = "pull_request";
function getCommentAuthor(request) {
    return request.body.comment.user.login;
}
exports.getCommentAuthor = getCommentAuthor;
function getPullRequestAuthor(request) {
    return request.body.pull_request.user.login;
}
exports.getPullRequestAuthor = getPullRequestAuthor;
function getComment(request) {
    return request.body.comment.body;
}
exports.getComment = getComment;
function getCommentCreationContext(request, application) {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.issue.number,
        author: getCommentAuthor(request),
    };
}
exports.getCommentCreationContext = getCommentCreationContext;
function getPullRequestCommentCreationContext(request, application) {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.pull_request.number,
        author: getPullRequestAuthor(request),
    };
}
exports.getPullRequestCommentCreationContext = getPullRequestCommentCreationContext;
function getPullRequestAction(request) {
    return request.body.action;
}
exports.getPullRequestAction = getPullRequestAction;
exports.pullRequestOpenActionName = "opened";
exports.pullRequestUpdateActionName = "synchronize";
function isPullRequestMerged(request, action) {
    if (action === "closed") {
        return request.body.pull_request.merged;
    }
    return false;
}
exports.isPullRequestMerged = isPullRequestMerged;
function isPullRequestClosed(request, action) {
    if (action === "closed") {
        return !request.body.pull_request.merged;
    }
    return false;
}
exports.isPullRequestClosed = isPullRequestClosed;
function getPullRequestId(request) {
    return request.body.pull_request.id;
}
exports.getPullRequestId = getPullRequestId;
function getBranchName(request) {
    return request.body.pull_request.head.ref;
}
exports.getBranchName = getBranchName;
function getHeadRepositoryCloneUrl(request) {
    return request.body.pull_request.head.repo.clone_url;
}
exports.getHeadRepositoryCloneUrl = getHeadRepositoryCloneUrl;
